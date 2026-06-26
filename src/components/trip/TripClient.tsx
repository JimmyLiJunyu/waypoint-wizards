"use client";
import { useState, useEffect, useRef } from "react";
import MapComponent from "../map/Map";
import AttractionSearch from "./AttractionSearch";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Attraction } from "@/types/attractions";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
} from "@dnd-kit/core";
import DraggableAttractionItem from "../itinerary/DraggableAttractionItem";
import ItinerarySidebar from "../itinerary/ItinerarySidebar";
import { arrayMove } from "@dnd-kit/sortable";
import TripDetailsPanel from "./TripDetailsPanel";
import { getDayColour } from "@/lib/dayColours";
import { DayLegs, ModeLeg } from "@/types/directions";
import { ColouredPolylineSegment } from "../map/Map";

// sort attractions by a combined score of rating and reviews
function sortAttractions(attractions: Attraction[]): Attraction[] {
  return [...attractions].sort((a, b) => {
    // wilson-score-style weighted sort
    const scoreA = (a.rating ?? 0) * Math.log10(Math.max(a.reviews ?? 1, 10));
    const scoreB = (b.rating ?? 0) * Math.log10(Math.max(b.reviews ?? 1, 10));
    return scoreB - scoreA;
  });
}

import CollaboratorPanel from "./CollaboratorPanel";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider, useStorage, useMutation, useMyPresence, useOthers } from "@/lib/liveblocks";
import { AttractionEntry } from "@/lib/liveblocks";

type CollaboratorUser = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type CollaboratorRecord = {
  id: number;
  role: string;
  userId: string;
  user: CollaboratorUser;
};

function TripClient({
  itineraryId,
  destination,
  startDate,
  endDate,
  savedItinerary,
  currentUserId,
  currentUserRole,
  collaborators,
}: {
  itineraryId: string;
  destination: string;
  startDate: string;
  endDate: string;
  savedItinerary: { [day: number]: Attraction[] };
  currentUserId: string;
  currentUserRole: string;
  collaborators: CollaboratorRecord[];
}) {
  return (
    <RoomProvider
      id={itineraryId}
      initialPresence={{ cursor: null, name: "", imageUrl: null }}
      initialStorage={() => ({
        itinerary: new LiveMap(
          Object.entries(savedItinerary).map(([day, attractions]) => [
            day,
            new LiveList(
              attractions.map(
                (a) =>
                  new LiveObject({
                    placeId: a.placeId,
                    instanceId: a.instanceId ?? a.placeId,
                    name: a.name,
                    address: a.address,
                    lat: a.lat,
                    lng: a.lng,
                    rating: a.rating,
                    reviews: a.reviews,
                  })
              )
            ),
          ])
        ),
      })}
    >
      <TripInner
        itineraryId={itineraryId}
        destination={destination}
        startDate={startDate}
        endDate={endDate}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        collaborators={collaborators}
      />
    </RoomProvider>
  );
}

function TripInner({
  itineraryId,
  destination,
  startDate,
  endDate,
  currentUserId,
  currentUserRole,
  collaborators,
}: {
  itineraryId: string;
  destination: string;
  startDate: string;
  endDate: string;
  currentUserId: string;
  currentUserRole: string;
  collaborators: CollaboratorRecord[];
}) {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 });
  const start = new Date(startDate);
  const end = new Date(endDate);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const cardRefs = useRef<{ [placeId: string]: HTMLDivElement | null }>({});

  const itinerary = useStorage((root) => {
    const result: { [day: number]: Attraction[] } = {};
    const entries = Object.entries(root.itinerary as unknown as Record<string, AttractionEntry[]>);
    entries.forEach(([dayStr, list]) => {
      result[parseInt(dayStr)] = list.map((obj) => ({ ...obj }));
    });
    return result;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [leftPanelView, setLeftPanelView] = useState<"attractions" | "details">(
    "attractions"
  );
  const [selectedDay, setSelectedDay] = useState(1);
  const [dayLegs, setDayLegs] = useState<{ [day: number]: DayLegs }>({});

  const [dayPolylines, setDayPolylines] = useState<{
    walking: string | null;
    driving: string | null;
    transit: ColouredPolylineSegment[] | null;
  }>({ walking: null, driving: null, transit: null });

  const [mapRouteMode, setMapRouteMode] = useState<
    "walking" | "driving" | "transit"
  >("driving");

  const markersToShow =
    leftPanelView === "details" ? itinerary[selectedDay] ?? [] : attractions;

  // map each attraction's key to its order number for the selected day
  const markerNumbers: { [key: string]: number } =
    leftPanelView === "details"
      ? Object.fromEntries(
          (itinerary[selectedDay] ?? []).map((a, i) => [
            a.instanceId ?? a.placeId,
            i + 1,
          ])
        )
      : {};

  const numDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const days = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date;
  });

  const updateItinerary = (newItinerary: { [day: number]: Attraction[] }) => {
    setItinerary(newItinerary);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/itinerary/${itineraryId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary }),
      });
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  // first fetch is for the location coordinates (from api/geocode), second fetch is for attractions based on the coordinates
  // attraction fetched is only 5km from the coordinates (can be changed in api/attractions)
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const addAttractionToDay = useMutation(
    ({ storage }, dayNumber: number, attraction: Attraction) => {
      const lb = storage.get("itinerary");
      const key = String(dayNumber);
      if (!lb.has(key)) lb.set(key, new LiveList([]));
      lb.get(key)!.push(
        new LiveObject({
          placeId: attraction.placeId,
          instanceId: `${attraction.placeId}-${Date.now()}`,
          name: attraction.name,
          address: attraction.address,
          lat: attraction.lat,
          lng: attraction.lng,
          rating: attraction.rating,
          reviews: attraction.reviews,
        })
      );
    },
    []
  );

  const moveAttraction = useMutation(
    (
      { storage },
      params: { instanceId: string; fromDay: number; toDay: number; toIndex: number }
    ) => {
      const lb = storage.get("itinerary");
      const fromList = lb.get(String(params.fromDay));
      if (!fromList) return;
      const fromIndex = [...fromList]
        .findIndex((o: LiveObject<AttractionEntry>) => o.get("instanceId") === params.instanceId);
      if (fromIndex === -1) return;
      const obj = fromList.get(fromIndex)!;
      const data: AttractionEntry = {
        placeId: obj.get("placeId"),
        instanceId: obj.get("instanceId"),
        name: obj.get("name"),
        address: obj.get("address"),
        lat: obj.get("lat"),
        lng: obj.get("lng"),
        rating: obj.get("rating"),
        reviews: obj.get("reviews"),
      };
      fromList.delete(fromIndex);
      const toList = lb.get(String(params.toDay));
      if (!toList) return;
      const newObj = new LiveObject(data);
      if (params.toIndex === -1) {
        toList.push(newObj);
      } else {
        toList.insert(newObj, params.toIndex);
      }
    },
    []
  );

  const removeAttraction = useMutation(
    ({ storage }, instanceId: string) => {
      const lb = storage.get("itinerary");
      lb.forEach((list) => {
        const idx = [...list].findIndex((o: LiveObject<AttractionEntry>) => o.get("instanceId") === instanceId);
        if (idx !== -1) list.delete(idx);
      });
    },
    []
  );

  useEffect(() => {
    const geocode = async () => {
      const res = await fetch(
        `/api/geocode?destination=${encodeURIComponent(destination)}`
      );
      const data = await res.json();
      setCenter(data.location);

      const attractionsRes = await fetch(
        `/api/attractions?lat=${data.location.lat}&lng=${data.location.lng}`
      );
      const attractionsData = await attractionsRes.json();
      setAttractions(sortAttractions(attractionsData.attractions));
    };
    geocode();
  }, [destination]);

  useEffect(() => {
    const fetchDirections = async () => {
      // collect every day that has 2+ attractions into a single batch
      const daysToFetch = Object.keys(itinerary)
        .map(Number)
        .filter((day) => (itinerary[day] ?? []).length >= 2);

      if (daysToFetch.length === 0) {
        setDayLegs({});
        setDayPolylines({ walking: null, driving: null, transit: null });
        return;
      }

      // we still only render one day's polyline on the map at a time,
      // so we keep `dayPolylines` scoped to selectedDay. But `dayLegs`
      // must be populated for every day so the panel can render them.
      const legResults = await Promise.all(
        daysToFetch.map(async (day) => {
          const dayAttractions = itinerary[day] ?? [];
          const waypoints = dayAttractions.map((a) => ({
            lat: a.lat,
            lng: a.lng,
          }));

          const res = await fetch("/api/directions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ waypoints }),
          });
          const data = await res.json();

          const transitLegs: ModeLeg[] = data.transit.legs ?? [];

          // flatten every leg's walk/transit segments into one ordered list
          // of coloured polylines so the whole day's journey (across
          // multiple attraction-to-attraction hops) draws as a single
          // continuous, colour-coded line on the map
          const transitColouredSegments: ColouredPolylineSegment[] =
            transitLegs.flatMap((leg) =>
              (leg.segments ?? [])
                .filter((seg) => !!seg.polyline)
                .map((seg) =>
                  seg.travelMode === "TRANSIT"
                    ? {
                        polyline: seg.polyline as string | string[],
                        colour: seg.lineColor ?? "#6B7280",
                      }
                    : {
                        polyline: seg.polyline as string | string[],
                        colour: "#6B7280",
                        dashed: true,
                      }
                )
            );

          return {
            day,
            legs: {
              walking: data.walking.legs,
              driving: data.driving.legs,
              transit: transitLegs,
            },
            polylines: {
              walking: data.walking.overviewPolyline as string | null,
              driving: data.driving.overviewPolyline as string | null,
              transit:
                transitColouredSegments.length > 0
                  ? transitColouredSegments
                  : null,
            },
          };
        })
      );

      const newLegs: typeof dayLegs = {};
      let selectedPolylines: {
        walking: string | null;
        driving: string | null;
        transit: ColouredPolylineSegment[] | null;
      } = { walking: null, driving: null, transit: null };

      for (const r of legResults) {
        newLegs[r.day] = r.legs;
        if (r.day === selectedDay) {
          selectedPolylines = r.polylines;
        }
      }

      setDayLegs(newLegs);
      setDayPolylines(selectedPolylines);
    };

    fetchDirections();
  }, [itinerary, selectedDay]);

  useEffect(() => {
    if (selectedAttraction) {
      cardRefs.current[selectedAttraction.placeId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedAttraction]);

  if (!itinerary) return <div>Connecting...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/itinerary/${itineraryId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary }),
      });
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const source = event.active.data.current?.source;
    const attraction = event.active.data.current?.attraction;

    if (attraction) {
      setActiveAttraction(attraction);
      return;
    }

    if (source === "list") {
      const attraction = attractions.find((a) => a.placeId === event.active.id);
      setActiveAttraction(attraction ?? null);
    } else if (source === "itinerary") {
      const attraction = Object.values(itinerary)
        .flat()
        .find((a) => a.instanceId === event.active.id);
      setActiveAttraction(attraction ?? null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAttraction(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const source = active.data.current?.source;

    if (overId.startsWith("day-")) {
      const dayNumber = parseInt(overId.replace("day-", ""));

      if (source === "list") {
        const attraction = attractions.find((a) => a.placeId === activeId);

        if (!attraction) {
          return;
        }

        // creating new instance
        const newInstance: Attraction = {
          ...attraction,
          instanceId: `${attraction.placeId}-${Date.now()}`,
        };

        const newItinerary = { ...itinerary };
        newItinerary[dayNumber] = [
          ...(newItinerary[dayNumber] ?? []),
          newInstance,
        ];
        updateItinerary(newItinerary);

        // dragging from itinerary -> use existing instance
        if (!attraction) return;
        addAttractionToDay(dayNumber, attraction);
        setHasUnsavedChanges(true);
      } else if (source === "itinerary") {
        // find from existing itinerary
        const attraction = Object.values(itinerary)
          .flat()
          .find((a) => a.instanceId === activeId);
        if (!attraction) {
          return;
        }
        const newItinerary = { ...itinerary };
        Object.keys(newItinerary).forEach((day) => {
          newItinerary[parseInt(day)] = newItinerary[parseInt(day)].filter(
            (a) => a.instanceId !== activeId
          );
        });
        newItinerary[dayNumber] = [
          ...(newItinerary[dayNumber] ?? []),
          attraction,
        ];
        updateItinerary(newItinerary);
        const activeDayNumber = parseInt(
          Object.keys(itinerary).find((day) =>
            itinerary[parseInt(day)].some((a) => a.instanceId === activeId)
          ) ?? "0"
        );
        if (!activeDayNumber) return;
        moveAttraction({ instanceId: activeId, fromDay: activeDayNumber, toDay: dayNumber, toIndex: -1 });
        setHasUnsavedChanges(true);
      }
    } else {
      const activeDayNumber = parseInt(
        Object.keys(itinerary).find((day) =>
          itinerary[parseInt(day)].some((a) => a.instanceId === activeId)
        ) ?? "0"
      );
      const overDayNumber = parseInt(
        Object.keys(itinerary).find((day) =>
          itinerary[parseInt(day)].some((a) => a.instanceId === overId)
        ) ?? "0"
      );

      if (!activeDayNumber || !overDayNumber) return;

      if (activeDayNumber === overDayNumber) {
        const dayAttractions = itinerary[activeDayNumber];
        const oldIndex = dayAttractions.findIndex((a) => a.instanceId === activeId);
        const newIndex = dayAttractions.findIndex((a) => a.instanceId === overId);
        if (oldIndex === -1 || newIndex === -1) return;
        moveAttraction({ instanceId: activeId, fromDay: activeDayNumber, toDay: activeDayNumber, toIndex: newIndex });
      } else {
        const overIndex = itinerary[overDayNumber].findIndex((a) => a.instanceId === overId);
        moveAttraction({ instanceId: activeId, fromDay: activeDayNumber, toDay: overDayNumber, toIndex: overIndex });
      }

      updateItinerary(newItinerary);
      setHasUnsavedChanges(true);
    }
  };

  const handleRemove = (instanceId: string) => {
    const newItinerary = { ...itinerary };
    Object.keys(newItinerary).forEach((day) => {
      newItinerary[parseInt(day)] = newItinerary[parseInt(day)].filter(
        (a) => a.instanceId !== instanceId
      );
    });
    updateItinerary(newItinerary);
    removeAttraction(instanceId);
    setHasUnsavedChanges(true);
  };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={["geometry"]}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <main className="flex h-full bg-[#F9F9F9]">
        <main
          className="flex h-screen bg-[#F9F9F9]"
          onPointerMove={(e) =>
            updateMyPresence({ cursor: { x: e.clientX, y: e.clientY } })
          }
          onPointerLeave={() => updateMyPresence({ cursor: null })}
        >
          {others.map((other) =>
            other.presence.cursor ? (
              <div
                key={other.connectionId}
                style={{
                  position: "fixed",
                  left: other.presence.cursor.x,
                  top: other.presence.cursor.y,
                  pointerEvents: "none",
                  zIndex: 999,
                  transform: "translate(-2px, -2px)",
                }}
                className="flex items-center gap-1"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-xs bg-blue-500 text-white px-1 rounded">
                  {other.presence.name}
                </span>
              </div>
            ) : null
          )}

          <div className="p-8 w-1/3 flex flex-col shrink-0">
            {/* toggle between attraction list and trip details */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() =>
                  setLeftPanelView(
                    leftPanelView === "attractions" ? "details" : "attractions"
                  )
                }
                className="px-4 py-2 rounded-full text-sm font-semibold shadow bg-white border hover:bg-gray-50 transition-colors"
              >
                {leftPanelView === "attractions"
                  ? "Trip Details →"
                  : "← Attractions"}
              </button>
            </div>
            {/* text showing location and dates */}
            <h1 className="text-4xl font-bold">
              The Next Station is {destination}{" "}
            </h1>
            <p className="text-gray-500 mt-2">
              {start.toDateString()} → {end.toDateString()}
            </p>

            {/* <AttractionSearch
            <AttractionSearch
              lat={center.lat}
              lng={center.lng}
              onResults={setAttractions}
            />
            <div className="mt-4 flex flex-col gap-2 overflow-y-auto flex-1">
              {attractions.map((attraction) => (
                <DraggableAttractionItem
                  key={attraction.placeId}
                  attraction={attraction}
                  isSelected={
                    selectedAttraction?.placeId === attraction.placeId
                  }
                  onClick={() => setSelectedAttraction(attraction)}
                  cardRef={(el) => {
                    cardRefs.current[attraction.placeId] = el;
                  }}
                />
              ))}
            </div> */}

            {/* changed to the toggle panel */}
            {leftPanelView === "attractions" ? (
              <>
                {/* attraction search component */}
                <AttractionSearch
                  lat={center.lat}
                  lng={center.lng}
                  onResults={(results) => setAttractions(sortAttractions(results))}
                />
                {/* attraction card list */}
                <div className="mt-4 flex flex-col gap-2 overflow-y-auto flex-1">
                  {attractions.map((attraction) => (
                    <DraggableAttractionItem
                      key={attraction.placeId}
                      attraction={attraction}
                      isSelected={
                        selectedAttraction?.placeId === attraction.placeId
                      }
                      onClick={() => setSelectedAttraction(attraction)}
                      cardRef={(el) => {
                        cardRefs.current[attraction.placeId] = el;
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <TripDetailsPanel
                itinerary={itinerary}
                days={days}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                dayLegs={dayLegs}
              />
            )}
              {attractions.map((attraction) => (
                <DraggableAttractionItem
                  key={attraction.placeId}
                  attraction={attraction}
                  isSelected={selectedAttraction?.placeId === attraction.placeId}
                  onClick={() => setSelectedAttraction(attraction)}
                  cardRef={(el) => {
                    cardRefs.current[attraction.placeId] = el;
                  }}
                />
              ))}
            </div>
          </div>
          {/* rendering map on the right spanning 2/3 of the screen */}
          {/* <div className="w-2/3 h-full"> */}
          {/* <div className="flex-1 h-full relative">

          <div className="flex-1 h-full relative">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-4 right-4 z-10 bg-red-500 text-white border rounded-full px-4 py-2 shadow font-semibold hover:bg-red-600 transition-colors"
            >
              {sidebarOpen ? "Hide Itinerary →" : "← Plan Itinerary"}
            </button>
            {leftPanelView === "details" && (
              <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white rounded-full shadow border p-1">
                {(["driving", "transit", "walking"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMapRouteMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                      mapRouteMode === mode
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
            <MapComponent
              destination={destination}
              attractions={markersToShow}
              center={center}
              selectedAttraction={selectedAttraction}
              onSelectAttraction={setSelectedAttraction}
              routePolyline={dayPolylines[mapRouteMode]}
              routeColour={getDayColour(selectedDay)}
              markerNumbers={markerNumbers}
            />
          </div> */}
          <div className="flex-1 h-full relative">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-4 right-15 z-10 bg-red-500 text-white border rounded-full px-4 py-2 shadow font-semibold hover:bg-red-600 transition-colors"
            >
              {sidebarOpen ? "Hide Itinerary →" : "← Plan Itinerary"}
            </button>
            {leftPanelView === "details" &&
              mapRouteMode === "transit" &&
              !dayPolylines.transit && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white border rounded-full shadow px-4 py-2 text-sm text-gray-600">
                  No transit route available for this day
                </div>
              )}
            {leftPanelView === "details" && (
              <div className="absolute top-16 left-4 z-10 flex gap-2 bg-white rounded-full shadow border p-1">
                {(["driving", "transit", "walking"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMapRouteMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                      mapRouteMode === mode
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
            <MapComponent
              destination={destination}
              attractions={markersToShow}
              center={center}
              selectedAttraction={selectedAttraction}
              onSelectAttraction={setSelectedAttraction}
              routePolyline={dayPolylines[mapRouteMode]}
              routeColour={getDayColour(selectedDay)}
              markerNumbers={markerNumbers}
            />
          </div>

          <CollaboratorPanel
            itineraryId={itineraryId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            initialCollaborators={collaborators}
          />
          <ItinerarySidebar
            startDate={startDate}
            endDate={endDate}
            itinerary={itinerary}
            isOpen={sidebarOpen}
            onRemove={handleRemove}
            onSave={handleSave}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </main>

        <DragOverlay>
          {activeAttraction && (
            <div className="border p-3 rounded-lg bg-white shadow-lg opacity-90">
              <h3 className="font-semibold">{activeAttraction.name}</h3>
              <p className="text-sm text-gray-500">{activeAttraction.rating} ⭐</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </APIProvider>
  );
}

export default TripClient;
