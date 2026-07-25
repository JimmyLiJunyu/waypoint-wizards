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
import CollaboratorPanel from "./CollaboratorPanel";
import BudgetPanel from "./BudgetPanel";
import TripPhotos from "./TripPhotos";
import TripTitleEditor from "./TripTitleEditor";
import { Compass, Map as MapIcon, ListOrdered } from "lucide-react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider, useStorage, useMutation, useOthers, useRoom } from "@/lib/liveblocks";
import { AttractionEntry } from "@/lib/liveblocks";

// sort attractions by a combined score of rating and reviews
function sortAttractions(attractions: Attraction[]): Attraction[] {
  return [...attractions].sort((a, b) => {
    // wilson-score-style weighted sort
    const scoreA = (a.rating ?? 0) * Math.log10(Math.max(a.reviews ?? 1, 10));
    const scoreB = (b.rating ?? 0) * Math.log10(Math.max(b.reviews ?? 1, 10));
    return scoreB - scoreA;
  });
}

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
  title,
  destination,
  startDate,
  endDate,
  savedItinerary,
  savedDayNotes = {},
  currentUserId,
  currentUserRole,
  collaborators,
}: {
  itineraryId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  savedItinerary: { [day: number]: Attraction[] };
  savedDayNotes?: { [day: number]: string };
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
                    rating: a.rating ?? 0,
                    reviews: a.reviews,
                    photoRef: a.photoRef,
                  })
              )
            ),
          ])
        ),
        dayNotes: new LiveMap(
          Object.entries(savedDayNotes).map(([day, note]) => [day, note])
        ),
      })}
    >
      <TripInner
        itineraryId={itineraryId}
        title={title}
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
  title,
  destination,
  startDate,
  endDate,
  currentUserId,
  currentUserRole,
  collaborators,
}: {
  itineraryId: string;
  title: string;
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
  const [panTarget, setPanTarget] = useState<Attraction | null>(null);
  const cardRefs = useRef<{ [placeId: string]: HTMLDivElement | null }>({});
  const listContainerRef = useRef<HTMLDivElement>(null);

  const itinerary = useStorage((root) => {
    const result: { [day: number]: Attraction[] } = {};
    const entries = Object.entries(root.itinerary as unknown as Record<string, AttractionEntry[]>);
    entries.forEach(([dayStr, list]) => {
      result[parseInt(dayStr)] = list.map((obj) => ({ ...obj }));
    });
    return result;
  }) ?? {};

  const dayNotes = useStorage((root) => {
    if (!root.dayNotes) return {};
    const result: { [day: number]: string } = {};
    const entries = Object.entries(root.dayNotes as unknown as Record<string, string>);
    entries.forEach(([dayStr, note]) => {
      if (note) result[parseInt(dayStr)] = note;
    });
    return result;
  }) ?? {};

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [skippedPlaces, setSkippedPlaces] = useState<string[]>([]);

  // Trip details / routing state (from HEAD)
  const [leftPanelView, setLeftPanelView] = useState<"attractions" | "details" | "budget" | "photos">("attractions");
  // Below the md breakpoint, only one of panel/map/itinerary is shown at a time.
  const [mobilePane, setMobilePane] = useState<"panel" | "map" | "itinerary">("panel");
  const [selectedDay, setSelectedDay] = useState(1);
  const [dayLegs, setDayLegs] = useState<{ [day: number]: DayLegs }>({});
  const [dayPolylines, setDayPolylines] = useState<{
    walking: string | null;
    driving: string | null;
    transit: ColouredPolylineSegment[] | null;
  }>({ walking: null, driving: null, transit: null });
  const [mapRouteMode, setMapRouteMode] = useState<"walking" | "driving" | "transit">("driving");

  // useRoom gives us a stable updatePresence that doesn't re-render this component.
  // useMyPresence would re-render on every cursor move, causing the directions
  // effect to re-fire on each mouse pixel.
  const room = useRoom();
  const others = useOthers();

  const markersToShow =
    leftPanelView === "details" ? itinerary[selectedDay] ?? [] : attractions;


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

  // Liveblocks mutations (from bbfb425)
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
          rating: attraction.rating ?? 0,
          reviews: attraction.reviews,
          photoRef: attraction.photoRef,
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
        photoRef: obj.get("photoRef"),
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

  const updateDayNote = useMutation(
    ({ storage }, { day, note }: { day: number; note: string }) => {
      const notes = storage.get("dayNotes");
      if (!notes) return;
      notes.set(String(day), note);
    },
    []
  );

  const clearAll = useMutation(({ storage }) => {
    const lb = storage.get("itinerary");
    const itineraryKeys = [...lb.keys()];
    itineraryKeys.forEach((key) => lb.set(key, new LiveList([])));
    const notes = storage.get("dayNotes");
    if (notes) {
      const noteKeys = [...notes.keys()];
      noteKeys.forEach((key) => notes.delete(key));
    }
  }, []);

  const applyAiItinerary = useMutation(
    (
      { storage },
      {
        days,
        mode,
      }: {
        days: { day: number; attractions: Omit<AttractionEntry, "instanceId">[]; description?: string }[];
        mode: "scratch" | "ontop";
      }
    ) => {
      const lb = storage.get("itinerary");
      const notes = storage.get("dayNotes");
      days.forEach(({ day, attractions, description }) => {
        const key = String(day);
        const existing = lb.get(key);
        if (mode === "ontop" && existing && existing.length > 0) return;
        lb.set(
          key,
          new LiveList(
            attractions.map(
              (a) =>
                new LiveObject({
                  ...a,
                  instanceId: `${a.placeId}-${Date.now()}-${Math.random()}`,
                })
            )
          )
        );
        if (description && notes) {
          const existingNote = notes.get(key) ?? "";
          if (mode === "scratch" || !existingNote.trim()) {
            notes.set(key, description);
          }
        }
      });
    },
    []
  );

  const handleAiGenerate = async (mode: "scratch" | "ontop") => {
    setIsGenerating(true);
    setSkippedPlaces([]);
    try {
      const res = await fetch(`/api/itinerary/${itineraryId}/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, numDays, lat: center.lat, lng: center.lng }),
      });
      const data = await res.json();
      applyAiItinerary({ days: data.days, mode });
      setSkippedPlaces(data.skipped ?? []);
      setHasUnsavedChanges(true);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('lastTripPath', `${window.location.pathname}${window.location.search}`);
  }, [itineraryId]);

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

  // Primitive string — React compares with ===, so the effect only re-runs
  // when attractions are actually added, removed, or reordered, not every time
  // useStorage returns a new object reference.
  const itineraryKey = JSON.stringify(
    Object.fromEntries(
      Object.entries(itinerary).map(([day, attractions]) => [
        day,
        attractions.map((a) => a.instanceId),
      ])
    )
  );

  useEffect(() => {
    const id = setTimeout(async () => {
    const daysToFetch = Object.keys(itinerary)
      .map(Number)
      .filter((day) => (itinerary[day] ?? []).length >= 2);

      if (daysToFetch.length === 0) {
        setDayLegs({});
        setDayPolylines({ walking: null, driving: null, transit: null });
        return;
      }

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
    }, 500);

    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryKey, selectedDay]);

  useEffect(() => {
    if (!selectedAttraction) return;
    const card = cardRefs.current[selectedAttraction.placeId];
    const container = listContainerRef.current;
    if (!card || !container) return;
    const cardRect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const cardTopInContainer = cardRect.top - containerRect.top + container.scrollTop;
    const cardBottomInContainer = cardTopInContainer + card.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (cardTopInContainer < visibleTop || cardBottomInContainer > visibleBottom) {
      container.scrollTo({ top: cardTopInContainer - 8, behavior: "smooth" });
    }
  }, [selectedAttraction]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/itinerary/${itineraryId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary, dayNotes }),
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
        <main
          className="flex h-full bg-[#F9F9F9] overflow-hidden pb-16 md:pb-0"
          onPointerMove={(e) =>
            room.updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
          }
          onPointerLeave={() => room.updatePresence({ cursor: null })}
        >
          <div className="fixed top-3 left-16 z-40 flex items-center gap-3 max-w-[calc(100vw-5rem)] overflow-x-auto py-1">
            <CollaboratorPanel
              itineraryId={itineraryId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              initialCollaborators={collaborators}
            />
            <TripTitleEditor itineraryId={itineraryId} initialTitle={title} />
          </div>

          {/* Live cursors for other collaborators */}
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

          <div
            className={`${
              mobilePane === "panel" ? "flex" : "hidden"
            } md:flex p-4 md:p-8 w-full md:w-1/3 flex-col shrink-0`}
          >
            {/* Tab navigation */}
            <div className="flex mb-2 bg-white border rounded-full p-1 shadow-sm">
              {(["attractions", "details", "budget", "photos"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setLeftPanelView(view)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    leftPanelView === view
                      ? "bg-red-500 text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="hidden sm:inline">
                    {view === "attractions" ? "Explore" : view === "details" ? "Details" : view === "budget" ? "Budget" : "Photos"}
                  </span>
                  <span className="sm:hidden">
                    {view === "attractions" ? "Explore" : view === "details" ? "Plan" : view === "budget" ? "$" : "📷"}
                  </span>
                </button>
              ))}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold mt-4">
              The Next Station is {destination}
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              {start.toDateString()} → {end.toDateString()}
            </p>

            {leftPanelView === "attractions" ? (
              <>
                <AttractionSearch
                  lat={center.lat}
                  lng={center.lng}
                  onResults={(results) => setAttractions(sortAttractions(results))}
                />
                <div ref={listContainerRef} className="mt-4 flex flex-col gap-2 overflow-y-auto flex-1">
                  {attractions.map((attraction) => (
                    <DraggableAttractionItem
                      key={attraction.placeId}
                      attraction={attraction}
                      isSelected={
                        selectedAttraction?.placeId === attraction.placeId
                      }
                      onClick={() => { setPanTarget(attraction); setSelectedAttraction(attraction); }}
                      cardRef={(el) => {
                        cardRefs.current[attraction.placeId] = el;
                      }}
                      numDays={numDays}
                      onAddToDay={(dayNumber) => {
                        addAttractionToDay(dayNumber, attraction);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : leftPanelView === "details" ? (
              <TripDetailsPanel
                itinerary={itinerary}
                days={days}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                dayLegs={dayLegs}
                dayNotes={dayNotes}
              />
            ) : leftPanelView === "budget" ? (
              <BudgetPanel
                itineraryId={itineraryId}
                collaborators={collaborators}
                currentUserId={currentUserId}
              />
            ) : (
              <TripPhotos itineraryId={itineraryId} currentUserId={currentUserId} />
            )}
          </div>

          <div
            className={`${
              mobilePane === "map" ? "block" : "hidden"
            } md:block flex-1 h-full relative`}
          >
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block absolute top-4 right-15 z-10 bg-red-500 text-white border rounded-full px-4 py-2 shadow font-semibold hover:bg-red-600 transition-colors"
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
              panTarget={panTarget}
              routePolyline={dayPolylines[mapRouteMode]}
              routeColour={getDayColour(selectedDay)}
              markerNumbers={markerNumbers}
            />
          </div>

          <ItinerarySidebar
            startDate={startDate}
            endDate={endDate}
            itinerary={itinerary}
            isOpen={sidebarOpen || mobilePane === "itinerary"}
            onRemove={handleRemove}
            onSave={handleSave}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            onAiGenerate={handleAiGenerate}
            isGenerating={isGenerating}
            skippedPlaces={skippedPlaces}
            dayNotes={dayNotes}
            onUpdateNote={(day, note) => updateDayNote({ day, note })}
            onClear={clearAll}
          />

          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg flex items-stretch">
            {(
              [
                { key: "panel",     label: "Explore",   icon: Compass },
                { key: "map",       label: "Map",       icon: MapIcon },
                { key: "itinerary", label: "Itinerary", icon: ListOrdered },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = mobilePane === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setMobilePane(tab.key)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors relative ${
                    active ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-full" />
                  )}
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
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