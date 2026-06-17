"use client";
import {
  Map,
  useApiIsLoaded,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import { Attraction } from "@/types/attractions";

function MapInner({
  center,
  attractions,
  selectedAttraction,
  onSelectAttraction,
  routePolyline,
  routeColour,
}: {
  center: { lat: number; lng: number };
  attractions: Attraction[];
  selectedAttraction: Attraction | null;
  onSelectAttraction: (attraction: Attraction | null) => void;
  routePolyline?: string | null;
  routeColour?: string;
}) {
  const isLoaded = useApiIsLoaded();
  const [selected, setSelected] = useState<Attraction | null>(null);
  const map = useMap();
  const [routeOverlay, setRouteOverlay] = useState<google.maps.Polyline | null>(
    null
  );

  // selecting attraction on the card list will pan to coordinates of attraction on the map
  useEffect(() => {
    if (map && selectedAttraction) {
      map.panTo({ lat: selectedAttraction.lat, lng: selectedAttraction.lng });
    }
  }, [map, selectedAttraction]);

  // map pans to coordinates of destination when loading
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  // draw / update the route polyline for the selected day
  useEffect(() => {
    if (!map || !isLoaded) return;

    // clear the previous route before drawing a new one
    setRouteOverlay((prevOverlay) => {
      prevOverlay?.setMap(null);
      return null;
    });

    if (!routePolyline) {
      return;
    }

    const path = google.maps.geometry.encoding.decodePath(routePolyline);
    const polyline = new google.maps.Polyline({
      path,
      strokeColor: routeColour ?? "#EF4444",
      strokeWeight: 4,
      strokeOpacity: 0.8,
    });
    polyline.setMap(map);
    setRouteOverlay(polyline);
  }, [map, isLoaded, routePolyline, routeColour]);

  // clean up the route overlay when the map component unmounts
  useEffect(() => {
    return () => {
      routeOverlay?.setMap(null);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        Loading Map...
      </div>
    );
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
          onClick={() => onSelectAttraction(attraction)}
        />
      ))}
      {/* info window shows upon selecting marker or selecting attraction card */}
      {selectedAttraction && (
        <InfoWindow
          position={{
            lat: selectedAttraction.lat,
            lng: selectedAttraction.lng,
          }}
          onCloseClick={() => onSelectAttraction(null)}
        >
          <div>
            <h2> {selectedAttraction.name} </h2>
            <p className="text-gray-500 text-sm">
              {selectedAttraction.address}
            </p>
            <p className="text-sm">
              Rating: {selectedAttraction.rating} ⭐ (
              {selectedAttraction.reviews} reviews)
            </p>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}

export default function MapComponent({
  destination,
  attractions,
  center,
  selectedAttraction,
  onSelectAttraction,
  routePolyline,
  routeColour
}: {
  destination: string;
  attractions: Attraction[];
  center: { lat: number; lng: number };
  selectedAttraction: Attraction | null;
  onSelectAttraction: (attraction: Attraction | null) => void;
  routePolyline?: string | null;
  routeColour?: string;
}) {
  // map rendering
  return (
    <MapInner
      center={center}
      attractions={attractions}
      selectedAttraction={selectedAttraction}
      onSelectAttraction={onSelectAttraction}
      routePolyline={routePolyline}
      routeColour={routeColour}
    />
  );
}
