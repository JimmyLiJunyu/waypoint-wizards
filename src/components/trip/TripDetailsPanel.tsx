"use client";
import { Attraction } from "@/types/attractions";
import { getDayColour } from "@/lib/dayColours";
import { DayLegs, ModeLeg, TransitSegment } from "@/types/directions";
import {
  Footprints,
  Car,
  Bus,
  Train,
  TramFront,
  Ship,
  CableCar,
} from "lucide-react";
import React from "react";

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  BUS:              <Bus size={12} />,
  INTERCITY_BUS:    <Bus size={12} />,
  SHARE_TAXI:       <Bus size={12} />,
  TRAIN:            <Train size={12} />,
  SUBWAY:           <Train size={12} />,
  METRO_RAIL:       <Train size={12} />,
  COMMUTER_TRAIN:   <Train size={12} />,
  HIGH_SPEED_TRAIN: <Train size={12} />,
  LONG_DISTANCE_TRAIN: <Train size={12} />,
  HEAVY_RAIL:       <Train size={12} />,
  RAIL:             <Train size={12} />,
  TRAM:             <TramFront size={12} />,
  LIGHT_RAIL:       <TramFront size={12} />,
  MONORAIL:         <TramFront size={12} />,
  FERRY:            <Ship size={12} />,
  CABLE_CAR:        <CableCar size={12} />,
  GONDOLA_LIFT:     <CableCar size={12} />,
  FUNICULAR:        <CableCar size={12} />,
};

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
        <Footprints size={12} />
        <span>{segment.durationText}</span>
      </div>
    );
  }

  const bg = segment.lineColor ?? "#6B7280";
  const fg = segment.lineTextColor ?? readableTextColour(bg);
  const icon = VEHICLE_ICONS[segment.vehicleType ?? ""] ?? <Bus size={12} />;
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
      <span className="flex-none">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function TransitRow({ leg }: { leg?: ModeLeg }) {
  if (!leg) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <Bus size={14} className="shrink-0" />
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
        <Bus size={14} className="shrink-0" />
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
  icon: React.ReactNode;
  label: string;
  leg?: ModeLeg;
}) {
  if (!leg) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <span className="flex-none">{icon}</span>
        <span>{label}: —</span>
      </div>
    );
  }

  if (leg.durationText === "—" || leg.distanceText === "—") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
        <span className="flex-none">{icon}</span>
        <span>No {label.toLowerCase()} route available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-2.5 py-1.5">
      <span className="flex-none">{icon}</span>
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
              <p className="text-base text-gray-700 mb-5 leading-relaxed pb-2 border-b border-gray-100">
                {dayNotes[dayNumber]}
              </p>
            )}

            {attractions.length === 0 ? (
              <p className="text-sm text-gray-400">No attractions planned yet.</p>
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
                        <p className="font-semibold text-sm">{attraction.name}</p>
                        <p className="text-xs text-gray-500">{attraction.address}</p>
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
                                icon={<Footprints size={14} />}
                                label="Walking"
                                leg={legs.walking[i]}
                              />
                              <ModeRow
                                icon={<Car size={14} />}
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
