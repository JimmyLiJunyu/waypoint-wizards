'use client'
import { Map, useApiIsLoaded, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';

interface Attraction {
    name: string;
    lat: number;
    lng: number;
    rating: number;
    address: string;
    placeId: string;
}

function MapInner({ center, attractions }: { 
    center: { lat: number, lng: number };
    attractions: Attraction[];
}) {
    const isLoaded = useApiIsLoaded();
    const [selected, setSelected] = useState<Attraction | null>(null);
    const map = useMap();

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
        {attractions.map((attraction) => (
            <Marker
                key={attraction.placeId}
                position={{ lat: attraction.lat, lng: attraction.lng }}
                onClick={() => setSelected(attraction)} />
        ))}
        {selected && (
            <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
            >
                <div>
                    <h3> {selected.name} </h3>
                    <p className="text-gray-500 text-sm">{selected.address}</p>
                    <p className="text-sm">Rating: {selected.rating} ⭐</p>
                </div>
            </InfoWindow>
        )}
      </Map>
    )
}

export default function MapComponent({ destination, attractions, center }: { 
    destination: string;
    attractions: Attraction[];
    center: { lat: number, lng: number }
 }) {

  return (
    <MapInner center={center} attractions={attractions} />
  )
}