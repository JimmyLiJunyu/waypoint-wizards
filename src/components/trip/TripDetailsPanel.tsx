"use client";
import { Attraction } from "@/types/attractions";
import { getDayColour } from "@/lib/dayColours";
import { DayLegs, ModeLeg, TransitSegment } from "@/types/directions";

const VEHICLE_ICONS: { [key: string]: string } = {
  BUS: "🚌",
  INTERCITY_BUS: "🚌",
  SHARE_TAXI: "🚐",
  TRAIN: "🚆",
  SUBWAY: "🚇",
  METRO_RAIL: "🚇",
  TRAM: "🚊",
  LIGHT_RAIL: "🚊",
  RAIL: "🚆",
  HEAVY_RAIL: "🚆",
  COMMUTER_TRAIN: "🚆",
  HIGH_SPEED_TRAIN: "🚄",
  LONG_DISTANCE_TRAIN: "🚆",
  MONORAIL: "🚝",
  FERRY: "⛴️",
  CABLE_CAR: "🚡",
  GONDOLA_LIFT: "🚡",
  FUNICULAR: "🚡",
};

// picks a readable text colour (black or white) against a given hex
// background so line chips stay legible regardless of the line's brand colour
function readableTextColour(hex?: string): string {
  if (!hex) return "#FFFFFF";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#FFFFFF";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1F2937" : "#FFFFFF";
}

function SegmentChip({ segment }: { segment: TransitSegment }) {
  if (segment.travelMode === "WALK") {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-full px-2 py-1 whitespace-nowrap">
        <span>🚶</span>
        <span>{segment.durationText}</span>
      </div>
    );
  }

  const bg = segment.lineColor ?? "#6B7280";
  const fg = segment.lineTextColor ?? readableTextColour(bg);
  const icon = VEHICLE_ICONS[segment.vehicleType ?? ""] ?? "🚌";
  const label = segment.lineShortName || segment.lineName || "Transit";

  return (
    <div
      className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap shadow-sm"
      style={{ backgroundColor: bg, color: fg }}
      title={
        segment.headsign
          ? `${segment.lineName ?? label} · towards ${segment.headsign}`
          : segment.lineName ?? label
      }
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function TransitRow({ leg }: { leg?: ModeLeg }) {
  if (!leg) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <span>🚌</span>
        <span>Transit: —</span>
      </div>
    );
  }

  const segments = leg.segments ?? [];
  const hasUsableRoute =
    leg.durationText !== "—" && leg.distanceText !== "—" && segments.length > 0;

  if (!hasUsableRoute) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <span>🚌</span>
        <span>No transit route available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 flex-wrap">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {idx > 0 && <span className="text-gray-300 text-xs">→</span>}
            <SegmentChip segment={segment} />
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-500 px-0.5">
        {leg.durationText} total
      </span>
    </div>
  );
}

function ModeRow({
  icon,
  label,
  leg,
}: {
  icon: string;
  label: string;
  leg?: ModeLeg;
}) {
  if (!leg) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <span>{icon}</span>
        <span>{label}: —</span>
      </div>
    );
  }

  // ZERO_RESULTS or failed request - no usable route for this mode
  if (leg.durationText === "—" || leg.distanceText === "—") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <span>{icon}</span>
        <span>No {label.toLowerCase()} route available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-2.5 py-1.5">
      <span className="text-base">{icon}</span>
      <span>{leg.durationText}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-500">{leg.distanceText}</span>
    </div>
  );
}

function TripDetailsPanel({
  itinerary,
  days,
  selectedDay,
  onSelectDay,
  dayLegs,
  dayNotes,
}: {
  itinerary: { [day: number]: Attraction[] };
  days: Date[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  dayLegs: { [day: number]: DayLegs };
  dayNotes: { [day: number]: string };
}) {
  return (
    <div className="mt-4 flex flex-col gap-4 overflow-y-auto flex-1">
      {days.map((date, index) => {
        const dayNumber = index + 1;
        const attractions = itinerary[dayNumber] ?? [];
        const colour = getDayColour(dayNumber);
        const legs = dayLegs[dayNumber];
        const isSelected = selectedDay === dayNumber;

        return (
          <div
            key={dayNumber}
            onClick={() => onSelectDay(dayNumber)}
            className={`border rounded-xl p-4 bg-white cursor-pointer transition-all ${
              isSelected ? "border-2 shadow-md" : "hover:shadow-sm"
            }`}
            style={isSelected ? { borderColor: colour } : undefined}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Day {dayNumber}</h3>
              <span className="text-sm text-gray-500">
                {date.toDateString()}
              </span>
            </div>

            {dayNotes[dayNumber] && (
              <p className="text-base text-gray-700 mb-3 leading-relaxed">
                {dayNotes[dayNumber]}
              </p>
            )}

            {attractions.length === 0 ? (
              <p className="text-sm text-gray-400">
                No attractions planned yet.
              </p>
            ) : (
              <div className="flex flex-col">
                {attractions.map((attraction, i) => (
                  <div key={attraction.instanceId ?? attraction.placeId}>
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: colour }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="font-semibold text-sm">
                          {attraction.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attraction.address}
                        </p>
                        <p className="text-xs text-gray-600">
                          {attraction.rating} ⭐ ({attraction.reviews})
                        </p>
                      </div>
                    </div>

                    {i < attractions.length - 1 && (
                      <div className="flex items-start gap-3 ml-3 my-1">
                        <div className="border-l-2 border-dotted border-gray-300 self-stretch min-h-[5.5rem]" />
                        <div className="flex flex-col gap-1.5 py-1">
                          {legs ? (
                            <>
                              <ModeRow
                                icon="🚶"
                                label="Walking"
                                leg={legs.walking[i]}
                              />
                              <ModeRow
                                icon="🚗"
                                label="Driving"
                                leg={legs.driving[i]}
                              />
                              <TransitRow leg={legs.transit[i]} />
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Calculating routes...
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TripDetailsPanel;
