'use client'
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
    MeasuringStrategy
} from '@dnd-kit/core';
import DraggableAttractionItem from "../itinerary/DraggableAttractionItem";
import ItinerarySidebar from "../itinerary/ItinerarySidebar";
import { arrayMove } from '@dnd-kit/sortable';

function TripClient({ destination, startDate, endDate }: {
    destination: string;
    startDate: string;
    endDate: string;
}) {
    
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 });
    const start = new Date(startDate);
    const end = new Date(endDate);
    const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
    const cardRefs = useRef<{ [placeId: string]: HTMLDivElement | null }>({});
    const [itinerary, setItinerary] = useState<{ [day: number]: Attraction[] }>({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 5 }
    }));

    // first fetch is for the location coordinates (from api/geocode), second fetch is for attractions based on the coordinates
    // attraction fetched is only 5km from the coordinates (can be changed in api/attractions)
    useEffect(() => {
        const geocode = async () => {
            const res = await fetch(`/api/geocode?destination=${encodeURIComponent(destination)}`);
            const data = await res.json();
            setCenter(data.location);
        
            const attractionsRes = await fetch(`/api/attractions?lat=${data.location.lat}&lng=${data.location.lng}`);
            const attractionsData = await attractionsRes.json();
            setAttractions(attractionsData.attractions);
        }
        geocode();
    }, [destination]);

    // selecting attracction marker on the map will scroll to selected attraction on the attraction card list
    useEffect(() => {
        if (selectedAttraction) {
            cardRefs.current[selectedAttraction.placeId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            })
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

        if (source === 'list') {
            const attraction = attractions.find(a => a.placeId === event.active.id);
            setActiveAttraction(attraction ?? null);
        } else if (source === 'itinerary') {
            const attraction = Object.values(itinerary).flat().find(a => a.instanceId === event.active.id);
            setActiveAttraction(attraction ?? null);
        }
    }

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
        if (overId.startsWith('day-')) {
            const dayNumber = parseInt(overId.replace('day-', ''))

            // dragging from attraction list -> creates new instance with unique ID
            if (source === 'list') {
                // find attraction from attraction list
                const attraction = attractions.find(a => a.placeId === activeId);

                if (!attraction) {
                    return;
                }

                // creating new instance
                const newInstance: Attraction = {
                    ...attraction,
                    instanceId: `${attraction.placeId}-${Date.now()}`
                }

                const newItinerary = { ...itinerary };
                newItinerary[dayNumber] = [...(newItinerary[dayNumber] ?? []), newInstance];
                setItinerary(newItinerary);
            
            // dragging from itinerary -> use existing instance
            } else if (source === 'itinerary') {
                // find from existing itinerary
                const attraction = Object.values(itinerary).flat().find(a => a.instanceId === activeId);
                if (!attraction) {
                    return;
                }
                const newItinerary = { ...itinerary };
                Object.keys(newItinerary).forEach(day => {
                    newItinerary[parseInt(day)] = newItinerary[parseInt(day)].filter(
                    a => a.instanceId !== activeId
                    )
                });
                newItinerary[dayNumber] = [...(newItinerary[dayNumber] ?? []), attraction];
                setItinerary(newItinerary);
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
            Object.keys(newItinerary).find(day =>
                newItinerary[parseInt(day)].some(a => a.instanceId === activeId)
            ) ?? '0'
            )

            // find the day of the dropping area
            const overDayNumber = parseInt(
            Object.keys(newItinerary).find(day =>
                newItinerary[parseInt(day)].some(a => a.instanceId === overId)
            ) ?? '0'
            )

            if (!activeDayNumber || !overDayNumber) {
                return;
            }

            if (activeDayNumber === overDayNumber) {

                // reordering within the same day
                const dayAttractions = [...newItinerary[activeDayNumber]];
                const oldIndex = dayAttractions.findIndex(a => a.instanceId === activeId);
                const newIndex = dayAttractions.findIndex(a => a.instanceId === overId);
                if (oldIndex === -1 || newIndex === -1) {
                    return;
                }

                newItinerary[activeDayNumber] = arrayMove(dayAttractions, oldIndex, newIndex);
                
            } else {

                // moving from one day to another day
                const attraction = newItinerary[activeDayNumber].find(a => a.instanceId === activeId);
                if (!attraction) {
                    return;
                }

                newItinerary[activeDayNumber] = newItinerary[activeDayNumber].filter(
                    a => a.instanceId !== activeId
                );

                const overIndex = newItinerary[overDayNumber].findIndex(a => a.instanceId === overId);
                newItinerary[overDayNumber] = [
                    ...newItinerary[overDayNumber].slice(0, overIndex),
                    attraction,
                    ...newItinerary[overDayNumber].slice(overIndex)
                ];
            }

            setItinerary(newItinerary);
        }
    }

    const handleRemove = (instanceId: string) => {
        const newItinerary = { ...itinerary };
        Object.keys(newItinerary).forEach(day => {
            newItinerary[parseInt(day)] = newItinerary[parseInt(day)].filter(
            a => a.instanceId !== instanceId
            )
        });
        setItinerary(newItinerary);
    }

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always
                    }
                }}
            >
                <main className="flex h-screen bg-[#F9F9F9]">
                    <div className="p-8 w-1/3 flex flex-col shrink-0">
                    {/* text showing location and dates */}
                        <h1 className="text-4xl font-bold">The Next Station is {destination} LOL</h1>
                        <p className="text-gray-500 mt-2"> {start.toDateString()} → {end.toDateString()} </p>
                        {/* attraction search component */}
                        <AttractionSearch
                            lat={center.lat}
                            lng={center.lng}
                            onResults={setAttractions}
                        />
                        {/* attraction card list */}
                        <div className="mt-4 flex flex-col gap-2 overflow-y-auto flex-1">
                            {/* {attractions.map((attraction) => (
                                <div key={attraction.placeId} ref={el => { cardRefs.current[attraction.placeId] = el }} 
                                    className={`border p-3 rounded-lg bg-white cursor-pointer 
                                        transition-colors ${selectedAttraction?.placeId == attraction.placeId
                                        ? 'border-red-500 bg-red-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedAttraction(attraction)}>
                                    <h3 className="font-semibold">{attraction.name}</h3>
                                    <p className="text-gray-500 text-sm">{attraction.address}</p>
                                    <p className="text-sm">Rating: {attraction.rating} ⭐ ({attraction.reviews} reviews)</p>
                                </div>
                            ))} */}
                            {attractions.map((attraction) => (
                                <DraggableAttractionItem
                                    key={attraction.placeId}
                                    attraction={attraction}
                                    isSelected={selectedAttraction?.placeId === attraction.placeId}
                                    onClick={() => setSelectedAttraction(attraction)}
                                    cardRef={el => { cardRefs.current[attraction.placeId] = el }}
                                />
                            ))}
                        </div>
                    </div>
                    {/* rendering map on the right spanning 2/3 of the screen */}
                    {/* <div className="w-2/3 h-full"> */}
                    <div className="flex-1 h-full relative">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="absolute top-4 right-4 z-10 bg-red-500 text-white border rounded-full px-4 py-2 shadow font-semibold hover:bg-red-600 transition-colors"
                        >
                            {sidebarOpen ? 'Hide Itinerary →' : '← Plan Itinerary'}
                        </button>
                        <MapComponent 
                            destination={destination} 
                            attractions={attractions} 
                            center={center} 
                            selectedAttraction={selectedAttraction} 
                            onSelectAttraction={setSelectedAttraction}/>
                    </div>
                    {/* itinerary sidebar */}
                    <ItinerarySidebar
                        startDate={startDate}
                        endDate={endDate}
                        itinerary={itinerary}
                        isOpen={sidebarOpen}
                        onRemove={handleRemove}/>
                </main>
                {/* ghost card while dragging */}
                <DragOverlay>
                    {activeAttraction && (
                        <div className="border p-3 rounded-lg bg-white shadow-lg opacity-90">
                            <h3 className="font-semibold"> {activeAttraction.name} </h3>
                            <p className="text-sm text-gray-500"> {activeAttraction.rating} ⭐ </p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </APIProvider>
    )
}

export default TripClient;  