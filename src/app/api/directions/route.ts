import { NextRequest, NextResponse } from "next/server";

type Waypoint = { lat: number; lng: number };

// one TransitSegment per step of the journey, e.g.
// [walk, North South Line, walk, Bus 171, walk]
interface TransitSegment {
  travelMode: "WALK" | "TRANSIT";
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  polyline?: string | string[] | null;
  lineName?: string;
  lineShortName?: string; // e.g. "NS" or "171"
  vehicleType?: string; // e.g. "SUBWAY", "BUS", "HEAVY_RAIL"
  vehicleIconUri?: string;
  lineColor?: string; // hex, from Google's own line colour
  lineTextColor?: string; // hex
  numStops?: number;
  headsign?: string; // direction / destination shown on the vehicle
  departureStop?: string;
  arrivalStop?: string;
}

interface ModeLeg {
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  transitLine?: string;
  transitVehicle?: string;
  // full breakdown of the leg, walk + transit + walk + ...
  segments?: TransitSegment[];
}

const ROUTES_API_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

const MODE_MAP: { [key: string]: string } = {
  walking: "WALK",
  driving: "DRIVE",
  transit: "TRANSIT",
};

function toWaypoint(point: Waypoint) {
  return {
    location: { latLng: { latitude: point.lat, longitude: point.lng } },
  };
}

async function computeRoute(
  origin: Waypoint,
  destination: Waypoint,
  intermediates: Waypoint[],
  mode: "walking" | "driving" | "transit"
): Promise<{ data: any; ok: boolean; errorMessage?: string }> {
  const body: any = {
    origin: toWaypoint(origin),
    destination: toWaypoint(destination),
    travelMode: MODE_MAP[mode],
    languageCode: "en-US",
    units: "METRIC",
  };

  if (intermediates.length > 0 && mode !== "transit") {
    body.intermediates = intermediates.map(toWaypoint);
  }

  if (mode === "transit") {
    // computeAlternativeRoutes off — we just want the primary itinerary
    body.computeAlternativeRoutes = false;
    body.departureTime = new Date(Date.now() + 60_000).toISOString(); // +1 min
  }

  const fieldMask = [
    "routes.legs.duration",
    "routes.legs.distanceMeters",
    "routes.legs.localizedValues",
    "routes.legs.steps.travelMode",
    "routes.legs.steps.distanceMeters",
    "routes.legs.steps.staticDuration",
    "routes.legs.steps.localizedValues",
    "routes.legs.steps.polyline.encodedPolyline",
    "routes.legs.steps.transitDetails",
    "routes.polyline.encodedPolyline",
    "routes.warnings",
  ].join(",");

  const res = await fetch(ROUTES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log(
    `[directions] mode=${mode} ok=${res.ok} status=${res.status} routes=${
      data.routes?.length ?? 0
    } error=${data.error?.message ?? "none"}`
  );

  if (!res.ok) {
    // surface the real reason instead of silently treating it as "no route"
    console.error(
      `[directions] mode=${mode} request failed:`,
      JSON.stringify(data.error ?? data, null, 2)
    );
    return {
      data,
      ok: false,
      errorMessage: data.error?.message ?? `HTTP ${res.status}`,
    };
  }

  return { data, ok: true };
}

// vehicle type -> a sane fallback colour when Google doesn't supply
// transitLine.color (this happens for some agencies, e.g. parts of Tokyo's
// network where colour metadata isn't published in the GTFS feed Google
// ingested). Without this, segments with no colour would all render the
// same as the default route colour, which defeats the point of colour-coding.
const VEHICLE_FALLBACK_COLOR: { [key: string]: string } = {
  BUS: "#7B61FF",
  INTERCITY_BUS: "#7B61FF",
  SHARE_TAXI: "#7B61FF",
  SUBWAY: "#0072BC",
  HEAVY_RAIL: "#0072BC",
  COMMUTER_TRAIN: "#0072BC",
  RAIL: "#0072BC",
  HIGH_SPEED_TRAIN: "#0072BC",
  LONG_DISTANCE_TRAIN: "#0072BC",
  METRO_RAIL: "#0072BC",
  MONORAIL: "#0072BC",
  TRAM: "#00A651",
  LIGHT_RAIL: "#00A651",
  FERRY: "#00AEEF",
  CABLE_CAR: "#F7941D",
  GONDOLA_LIFT: "#F7941D",
  FUNICULAR: "#F7941D",
  OTHER: "#6B7280",
};

function extractRawSegments(leg: any): TransitSegment[] {
  const steps = leg.steps ?? [];

  return steps.map((step: any): TransitSegment => {
    const distanceText =
      step.localizedValues?.distance?.text ?? `${step.distanceMeters ?? 0} m`;
    const durationText =
      step.localizedValues?.staticDuration?.text ?? step.staticDuration ?? "—";
    const durationSeconds = parseInt(
      (step.staticDuration ?? "0s").replace("s", "")
    );
    const polyline = step.polyline?.encodedPolyline ?? null;

    if (step.travelMode === "TRANSIT" && step.transitDetails) {
      const line = step.transitDetails.transitLine;
      const vehicleType = line?.vehicle?.type ?? "TRANSIT";
      return {
        travelMode: "TRANSIT",
        distanceText,
        durationText,
        durationSeconds,
        polyline,
        lineName: line?.name || line?.nameShort || "Transit",
        lineShortName: line?.nameShort || undefined,
        vehicleType,
        vehicleIconUri: line?.vehicle?.iconUri ?? undefined,
        lineColor:
          line?.color || VEHICLE_FALLBACK_COLOR[vehicleType] || "#6B7280",
        lineTextColor: line?.textColor || "#FFFFFF",
        numStops: step.transitDetails.stopCount ?? undefined,
        headsign: step.transitDetails.headsign ?? undefined,
        departureStop:
          step.transitDetails.stopDetails?.departureStop?.name ?? undefined,
        arrivalStop:
          step.transitDetails.stopDetails?.arrivalStop?.name ?? undefined,
      };
    }

    return {
      travelMode: "WALK",
      distanceText,
      durationText,
      durationSeconds,
      polyline,
    };
  });
}

// formats a total seconds count back into Google's "X mins" / "X hour Y mins"
// style text, since once we sum several walk steps together the original
// per-step localized text (e.g. "1 min") no longer applies to the combined total
function formatDurationText(totalSeconds: number): string {
  if (totalSeconds <= 0) return "1 min";
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${Math.max(minutes, 1)} min${minutes === 1 ? "" : "s"}`;
  }
  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} min${
    minutes === 1 ? "" : "s"
  }`;
}

function formatDistanceText(totalMeters: number): string {
  if (totalMeters < 1000) return `${Math.round(totalMeters)} m`;
  return `${(totalMeters / 1000).toFixed(1)} km`;
}

// Google's Routes API returns each little walking sub-step separately (walk
// to the platform, walk along the platform, walk up the stairs, walk to the
// stop, etc), which renders as a long noisy chain like 1 min -> 2 min -> 1
// min -> 1 min in the UI. This collapses any run of consecutive WALK
// segments into a single combined walking segment (summed duration +
// distance, polylines concatenated in order) so transfers show as one
// walking time between transit legs, e.g. walk 17 min -> NS Line -> walk 18 min.
function mergeConsecutiveWalkSegments(
  segments: TransitSegment[]
): TransitSegment[] {
  const merged: TransitSegment[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];

    if (
      segment.travelMode === "WALK" &&
      previous &&
      previous.travelMode === "WALK"
    ) {
      const prevMeters = parseDistanceMeters(previous.distanceText);
      const currMeters = parseDistanceMeters(segment.distanceText);
      const totalSeconds = previous.durationSeconds + segment.durationSeconds;
      const totalMeters = prevMeters + currMeters;

      previous.durationSeconds = totalSeconds;
      previous.durationText = formatDurationText(totalSeconds);
      previous.distanceText = formatDistanceText(totalMeters);
      // keep every original encoded polyline piece for this merged walking
      // stretch (joined with "|") so the frontend can decode each piece and
      // concatenate their paths into one continuous line on the map
      if (segment.polyline) {
        const existingPieces = Array.isArray(previous.polyline)
          ? previous.polyline
          : previous.polyline
          ? [previous.polyline]
          : [];
        const newPiece = segment.polyline;
        previous.polyline = Array.isArray(newPiece)
          ? [...existingPieces, ...newPiece]
          : [...existingPieces, newPiece];
      }
      continue;
    }

    // copy so we don't mutate the original extracted segment in place
    merged.push({ ...segment });
  }

  return merged;
}

// best-effort parse of a localized distance string ("1.2 km", "350 m") back
// into a metre count purely so we can sum two walk segments' distances
function parseDistanceMeters(distanceText: string): number {
  const match = distanceText.match(/([\d.]+)\s*(km|m)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  return match[2].toLowerCase() === "km" ? value * 1000 : value;
}

function extractSegments(leg: any): TransitSegment[] {
  return mergeConsecutiveWalkSegments(extractRawSegments(leg));
}

function extractModeLeg(leg: any): ModeLeg {
  const segments = extractSegments(leg);

  const result: ModeLeg = {
    distanceText:
      leg.localizedValues?.distance?.text ?? `${leg.distanceMeters ?? 0} m`,
    durationText: leg.localizedValues?.duration?.text ?? leg.duration ?? "—",
    durationSeconds: parseInt((leg.duration ?? "0s").replace("s", "")),
    segments,
  };

  // keep the old single-line summary fields around for any callers that
  // still expect them (first transit segment in the journey)
  const firstTransit = segments.find((s) => s.travelMode === "TRANSIT");
  if (firstTransit) {
    result.transitLine = firstTransit.lineShortName || firstTransit.lineName;
    result.transitVehicle = firstTransit.vehicleType;
  }

  return result;
}

const EMPTY_LEG: ModeLeg = {
  distanceText: "—",
  durationText: "—",
  durationSeconds: 0,
  segments: [],
};

// builds one ModeLeg per consecutive pair of waypoints for a given mode.
// Transit legs are always computed one pair at a time (rather than as a
// single multi-waypoint request) because the Routes API does not support
// intermediate waypoints for TRANSIT travel mode at all - passing them
// silently drops the waypoints rather than erroring, which is what was
// causing far-apart Tokyo legs to come back empty: the in-between stop was
// being ignored and the API was trying (and sometimes failing) to find a
// single-hop transit route across the whole multi-stop span.
async function getLegsForMode(
  waypoints: Waypoint[],
  mode: "walking" | "driving" | "transit"
): Promise<{
  legs: ModeLeg[];
  overviewPolyline: string | null;
  allPolylines?: string[];
  errors?: (string | null)[];
}> {
  if (mode === "transit") {
    const legs: ModeLeg[] = [];
    const polylines: (string | null)[] = [];
    const errors: (string | null)[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const { data, ok, errorMessage } = await computeRoute(
        waypoints[i],
        waypoints[i + 1],
        [],
        mode
      );
      const route = data.routes?.[0];

      if (!ok) {
        legs.push(EMPTY_LEG);
        polylines.push(null);
        errors.push(errorMessage ?? "Request failed");
        continue;
      }

      if (!route || !route.legs?.[0]) {
        legs.push(EMPTY_LEG);
        polylines.push(null);
        // a successful (200) response with no routes means Google
        // genuinely found ZERO_RESULTS for transit between these two points
        errors.push("No transit route available");
        continue;
      }

      legs.push(extractModeLeg(route.legs[0]));
      polylines.push(route.polyline?.encodedPolyline ?? null);
      errors.push(null);
    }

    const validPolylines = polylines.filter(
      (p): p is string => typeof p === "string" && p.length > 0
    );

    return {
      legs,
      overviewPolyline: validPolylines.length > 0 ? validPolylines[0] : null,
      allPolylines: validPolylines,
      errors,
    };
  }

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediates = waypoints.slice(1, -1);

  const { data, ok } = await computeRoute(
    origin,
    destination,
    intermediates,
    mode
  );
  const route = data.routes?.[0];

  if (!ok || !route || !route.legs) {
    return { legs: [], overviewPolyline: null };
  }

  const legs = route.legs.map(extractModeLeg);

  return { legs, overviewPolyline: route.polyline?.encodedPolyline ?? null };
}

// waypoints are in visiting order for a single day
export async function POST(req: NextRequest) {
  const body = await req.json();
  const waypoints: Waypoint[] = body.waypoints;

  if (!waypoints || waypoints.length < 2) {
    return NextResponse.json({
      walking: { legs: [], overviewPolyline: null },
      driving: { legs: [], overviewPolyline: null },
      transit: { legs: [], overviewPolyline: null },
    });
  }

  const [walking, driving, transit] = await Promise.all([
    getLegsForMode(waypoints, "walking"),
    getLegsForMode(waypoints, "driving"),
    getLegsForMode(waypoints, "transit"),
  ]);

  return NextResponse.json({ walking, driving, transit });
}
