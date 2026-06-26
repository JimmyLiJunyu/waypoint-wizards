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
      setAttractions(attractionsData.attractions);
    };
    geocode();
  }, [destination]);

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
        if (!attraction) return;
        addAttractionToDay(dayNumber, attraction);
        setHasUnsavedChanges(true);
      } else if (source === "itinerary") {
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
      setHasUnsavedChanges(true);
    }
  };

  const handleRemove = (instanceId: string) => {
    removeAttraction(instanceId);
    setHasUnsavedChanges(true);
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
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
            <h1 className="text-4xl font-bold">
              The Next Station is {destination}{" "}
            </h1>
            <p className="text-gray-500 mt-2">
              {start.toDateString()} → {end.toDateString()}
            </p>
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
                  isSelected={selectedAttraction?.placeId === attraction.placeId}
                  onClick={() => setSelectedAttraction(attraction)}
                  cardRef={(el) => {
                    cardRefs.current[attraction.placeId] = el;
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 h-full relative">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-4 right-4 z-10 bg-red-500 text-white border rounded-full px-4 py-2 shadow font-semibold hover:bg-red-600 transition-colors"
            >
              {sidebarOpen ? "Hide Itinerary →" : "← Plan Itinerary"}
            </button>
            <MapComponent
              destination={destination}
              attractions={attractions}
              center={center}
              selectedAttraction={selectedAttraction}
              onSelectAttraction={setSelectedAttraction}
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
