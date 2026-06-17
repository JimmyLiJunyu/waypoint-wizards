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

function TripClient({
  itineraryId,
  destination,
  startDate,
  endDate,
  savedItinerary,
}: {
  itineraryId: string;
  destination: string;
  startDate: string;
  endDate: string;
  savedItinerary: { [day: number]: Attraction[] };
}) {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 });
  const start = new Date(startDate);
  const end = new Date(endDate);
  const [selectedAttraction, setSelectedAttraction] =
    useState<Attraction | null>(null);
  const cardRefs = useRef<{ [placeId: string]: HTMLDivElement | null }>({});
  const [itinerary, setItinerary] = useState<{ [day: number]: Attraction[] }>(
    savedItinerary
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(
    null
  );
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
  const [dayLegs, setDayLegs] = useState<{
    [day: number]: {
      walking: {
        distanceText: string;
        durationText: string;
        durationSeconds: number;
      }[];
      driving: {
        distanceText: string;
        durationText: string;
        durationSeconds: number;
      }[];
      transit: {
        distanceText: string;
        durationText: string;
        durationSeconds: number;
        transitLine?: string;
        transitVehicle?: string;
      }[];
    };
  }>({});

  const [dayPolylines, setDayPolylines] = useState<{
    walking: string | null;
    driving: string | null;
    transit: string | null;
  }>({ walking: null, driving: null, transit: null });
  const [mapRouteMode, setMapRouteMode] = useState<
    "walking" | "driving" | "transit"
  >("driving");

  const markersToShow =
    leftPanelView === "details" ? itinerary[selectedDay] ?? [] : attractions;

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
      setAttractions(attractionsData.attractions);
    };
    geocode();
  }, [destination]);

  // fetch walking/driving/public transport directions for the selected day whenever its attractions change
  useEffect(() => {
    const fetchDirections = async () => {
      const dayAttractions = itinerary[selectedDay] ?? [];

      if (dayAttractions.length < 2) {
        setDayPolylines({ walking: null, driving: null, transit: null });
        return;
      }

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

      setDayLegs((prev) => ({
        ...prev,
        [selectedDay]: {
          walking: data.walking.legs,
          driving: data.driving.legs,
          transit: data.transit.legs,
        },
      }));
      setDayPolylines({
        walking: data.walking.overviewPolyline,
        driving: data.driving.overviewPolyline,
        transit: data.transit.overviewPolyline,
      });
    };

    fetchDirections();
  }, [selectedDay, itinerary]);

  // selecting attracction marker on the map will scroll to selected attraction on the attraction card list
  useEffect(() => {
    if (selectedAttraction) {
      cardRefs.current[selectedAttraction.placeId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedAttraction]);

  //Dragging logic
  // find the attraction from attraction list or existing itinerary
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

  // dropping the attraction and checking the day number it was dropped on
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAttraction(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const source = active.data.current?.source;

    // new attraction drop on day card or reordering within each day
    if (overId.startsWith("day-")) {
      const dayNumber = parseInt(overId.replace("day-", ""));

      // dragging from attraction list -> creates new instance with unique ID
      if (source === "list") {
        // find attraction from attraction list
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
      }
    } else {
      const newItinerary = { ...itinerary };

      // find the day for reordering
      // const dayNumber = parseInt(
      // Object.keys(newItinerary).find(day =>
      //     newItinerary[parseInt(day)].some(a => a.placeId === overId)
      // ) ?? '0');

      // find the day where the attraction is in
      const activeDayNumber = parseInt(
        Object.keys(newItinerary).find((day) =>
          newItinerary[parseInt(day)].some((a) => a.instanceId === activeId)
        ) ?? "0"
      );

      // find the day of the dropping area
      const overDayNumber = parseInt(
        Object.keys(newItinerary).find((day) =>
          newItinerary[parseInt(day)].some((a) => a.instanceId === overId)
        ) ?? "0"
      );

      if (!activeDayNumber || !overDayNumber) {
        return;
      }

      if (activeDayNumber === overDayNumber) {
        // reordering within the same day
        const dayAttractions = [...newItinerary[activeDayNumber]];
        const oldIndex = dayAttractions.findIndex(
          (a) => a.instanceId === activeId
        );
        const newIndex = dayAttractions.findIndex(
          (a) => a.instanceId === overId
        );
        if (oldIndex === -1 || newIndex === -1) {
          return;
        }

        newItinerary[activeDayNumber] = arrayMove(
          dayAttractions,
          oldIndex,
          newIndex
        );
      } else {
        // moving from one day to another day
        const attraction = newItinerary[activeDayNumber].find(
          (a) => a.instanceId === activeId
        );
        if (!attraction) {
          return;
        }

        newItinerary[activeDayNumber] = newItinerary[activeDayNumber].filter(
          (a) => a.instanceId !== activeId
        );

        const overIndex = newItinerary[overDayNumber].findIndex(
          (a) => a.instanceId === overId
        );
        newItinerary[overDayNumber] = [
          ...newItinerary[overDayNumber].slice(0, overIndex),
          attraction,
          ...newItinerary[overDayNumber].slice(overIndex),
        ];
      }

      updateItinerary(newItinerary);
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
        <main className="flex h-screen bg-[#F9F9F9]">
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
              {" "}
              {start.toDateString()} → {end.toDateString()}{" "}
            </p>

            {/* <AttractionSearch
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
                  onResults={setAttractions}
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
          </div>
          {/* rendering map on the right spanning 2/3 of the screen */}
          {/* <div className="w-2/3 h-full"> */}
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
            />
          </div>
          {/* itinerary sidebar */}
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
        {/* ghost card while dragging */}
        <DragOverlay>
          {activeAttraction && (
            <div className="border p-3 rounded-lg bg-white shadow-lg opacity-90">
              <h3 className="font-semibold"> {activeAttraction.name} </h3>
              <p className="text-sm text-gray-500">
                {" "}
                {activeAttraction.rating} ⭐{" "}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </APIProvider>
  );
}

export default TripClient;
