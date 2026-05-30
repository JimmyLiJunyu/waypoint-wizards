'use client'
import { Map, useApiIsLoaded, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import { Attraction } from '@/types/attractions';

function MapInner({ center, attractions, selectedAttraction, onSelectAttraction }: { 
    center: { lat: number, lng: number };
    attractions: Attraction[];
    selectedAttraction: Attraction | null;
    onSelectAttraction: (attraction: Attraction | null) => void;
}) {
    const isLoaded = useApiIsLoaded();
    const [selected, setSelected] = useState<Attraction | null>(null);
    const map = useMap();

    // selecting attraction on the card list will pan to coordinates of attraction on the map
    useEffect(() => {
        if (map && selectedAttraction) {
            map.panTo({ lat: selectedAttraction.lat, lng: selectedAttraction.lng })
        }
    }, [map, selectedAttraction]);

    // map pans to coordinates of destination when loading
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [map, center]);
  
    if (!isLoaded) {
        return <div className="w-full h-screen flex items-center justify-center">Loading Map...</div>
    }
  
    return (
        <Map
            defaultZoom={12}
            defaultCenter={center}
            className="w-full h-screen"
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        >
        {/* attraction markers */}
        {attractions.map((attraction) => (
            <AdvancedMarker
                key={attraction.placeId}
                position={{ lat: attraction.lat, lng: attraction.lng }}
                onClick={() => onSelectAttraction(attraction)} />
        ))}
        {/* info window shows upon selecting marker or selecting attraction card */}
        {selectedAttraction && (
            <InfoWindow
                position={{ lat: selectedAttraction.lat, lng: selectedAttraction.lng }}
                onCloseClick={() => onSelectAttraction(null)}
            >
                <div>
                    <h2> {selectedAttraction.name} </h2>
                    <p className="text-gray-500 text-sm">{selectedAttraction.address}</p>
                    <p className="text-sm">Rating: {selectedAttraction.rating} ⭐ ({selectedAttraction.reviews} reviews)</p>
                </div>
            </InfoWindow>
        )}
      </Map>
    )
}

export default function MapComponent({ destination, attractions, center, selectedAttraction, onSelectAttraction }: { 
    destination: string;
    attractions: Attraction[];
    center: { lat: number, lng: number };
    selectedAttraction: Attraction | null;
    onSelectAttraction: (attraction: Attraction | null) => void;
 }) {

    // map rendering
    return (
        <MapInner 
            center={center} 
            attractions={attractions} 
            selectedAttraction={selectedAttraction} 
            onSelectAttraction={onSelectAttraction}/>
    )
}