import { NextRequest, NextResponse } from "next/server";

type Waypoint = { lat: number; lng: number };

interface ModeLeg {
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  transitLine?: string; // e.g. "JR Yamanote Line" or "Bus 23"
  transitVehicle?: string; // e.g. "TRAIN", "BUS", "SUBWAY"
}

async function fetchMode(
  origin: Waypoint,
  destination: Waypoint,
  intermediate: Waypoint[],
  mode: "walking" | "driving" | "transit"
) {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key: process.env.GOOGLE_MAPS_API_KEY!,
  });

  if (intermediate.length > 0) {
    // transit mode does not support waypoints - Google will error if passed
    if (mode !== "transit") {
      params.set(
        "waypoints",
        intermediate.map((w) => `${w.lat},${w.lng}`).join("|")
      );
    }
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
  );
  return res.json();
}

// builds one ModeLeg per consecutive pair of waypoints for a given mode
async function getLegsForMode(
  waypoints: Waypoint[],
  mode: "walking" | "driving" | "transit"
): Promise<{ legs: ModeLeg[]; overviewPolyline: string | null }> {
  // transit doesn't support waypoints in a single request, so for transit
  // with more than 2 points we fetch leg-by-leg instead
  if (mode === "transit" && waypoints.length > 2) {
    const legs: ModeLeg[] = [];
    let polyline: string | null = null;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const data = await fetchMode(waypoints[i], waypoints[i + 1], [], mode);
      if (data.status !== "OK" || !data.routes[0]) {
        legs.push({ distanceText: "—", durationText: "—", durationSeconds: 0 });
        continue;
      }
      const route = data.routes[0];
      const leg = route.legs[0];
      legs.push(extractModeLeg(leg));
      if (i === 0) polyline = route.overview_polyline.points;
    }

    return { legs, overviewPolyline: polyline };
  }

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediate = waypoints.slice(1, -1);

  const data = await fetchMode(origin, destination, intermediate, mode);

  if (data.status !== "OK" || !data.routes[0]) {
    return { legs: [], overviewPolyline: null };
  }

  const route = data.routes[0];
  const legs = route.legs.map(extractModeLeg);

  return { legs, overviewPolyline: route.overview_polyline.points };
}

function extractModeLeg(leg: any): ModeLeg {
  const result: ModeLeg = {
    distanceText: leg.distance.text,
    durationText: leg.duration.text,
    durationSeconds: leg.duration.value,
  };

  // find the first transit step to surface the line/vehicle name
  const transitStep = leg.steps?.find(
    (step: any) => step.travel_mode === "TRANSIT" && step.transit_details
  );

  if (transitStep) {
    const details = transitStep.transit_details;
    result.transitLine =
      details.line?.short_name || details.line?.name || "Transit";
    result.transitVehicle = details.line?.vehicle?.type ?? "TRANSIT";
  }

  return result;
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
