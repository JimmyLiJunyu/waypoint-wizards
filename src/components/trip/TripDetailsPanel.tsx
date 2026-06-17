"use client";
import { Attraction } from "@/types/attractions";
import { getDayColour } from "@/lib/dayColours";

interface ModeLeg {
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  transitLine?: string;
  transitVehicle?: string;
}

interface DayLegs {
  walking: ModeLeg[];
  driving: ModeLeg[];
  transit: ModeLeg[];
}

const VEHICLE_ICONS: { [key: string]: string } = {
  BUS: "🚌",
  TRAIN: "🚆",
  SUBWAY: "🚇",
  TRAM: "🚊",
  RAIL: "🚆",
  HEAVY_RAIL: "🚆",
  COMMUTER_TRAIN: "🚆",
  FERRY: "⛴️",
};

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
      <span className="text-xs text-gray-400">
        {icon} {label}: —
      </span>
    );
  }

  if (label === "Transit" && leg.transitLine) {
    const vehicleIcon = VEHICLE_ICONS[leg.transitVehicle ?? ""] ?? "🚌";
    return (
      <span className="text-xs text-gray-500">
        {vehicleIcon} {leg.transitLine} · {leg.durationText}
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-500">
      {icon} {leg.durationText} · {leg.distanceText}
    </span>
  );
}

function TripDetailsPanel({
  itinerary,
  days,
  selectedDay,
  onSelectDay,
  dayLegs,
}: {
  itinerary: { [day: number]: Attraction[] };
  days: Date[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  dayLegs: { [day: number]: DayLegs };
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
                        <div className="border-l-2 border-dotted border-gray-300 self-stretch min-h-[3.5rem]" />
                        <div className="flex flex-col gap-0.5 py-1">
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
                              <ModeRow
                                icon="🚌"
                                label="Transit"
                                leg={legs.transit[i]}
                              />
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
