'use client'
import { useState, useEffect, useRef } from "react";
import MapComponent from "../map/Map";
import AttractionSearch from "./AttractionSearch";
import { APIProvider } from "@vis.gl/react-google-maps";

interface Attraction {
    name: string;
    lat: number;
    lng: number;
    rating: number;
    address: string;
    reviews: number;
    placeId: string;
}

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

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <main className="flex h-screen bg-[#F9F9F9]">
                <div className="p-8 w-1/3 flex flex-col">
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
                        {attractions.map((attraction) => (
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
                        ))}
                    </div>
                </div>
                {/* rendering map on the right spanning 2/3 of the screen */}
                <div className="w-2/3 h-full">
                    <MapComponent 
                        destination={destination} 
                        attractions={attractions} 
                        center={center} 
                        selectedAttraction={selectedAttraction} 
                        onSelectAttraction={setSelectedAttraction}/>
                </div>
            </main>
        </APIProvider>
    )
}

export default TripClient;  