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

export interface ColouredPolylineSegment {
    polyline: string | string[];
    colour: string;
    dashed?: boolean;
  }

function MapInner({
  center,
  attractions,
  selectedAttraction,
  onSelectAttraction,
  routePolyline,
  routeColour,
  markerNumbers,
}: {
  center: { lat: number; lng: number };
  attractions: Attraction[];
  selectedAttraction: Attraction | null;
  onSelectAttraction: (attraction: Attraction | null) => void;
  routePolyline?: string | string[] | ColouredPolylineSegment[] | null;
  routeColour?: string;
  markerNumbers?: { [key: string]: number };
}) {
  const isLoaded = useApiIsLoaded();
  const [selected, setSelected] = useState<Attraction | null>(null);
  const map = useMap();
  const [routeOverlays, setRouteOverlays] = useState<google.maps.Polyline[]>(
    []
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

  // draw / update the route polyline(s) for the selected day
  useEffect(() => {
    if (!map || !isLoaded) return;

    // clear the previous route(s) before drawing new ones
    setRouteOverlays((prevOverlays) => {
      prevOverlays.forEach((overlay) => overlay.setMap(null));
      return [];
    });

    if (!routePolyline) {
      return;
    }

    // figure out whether we got plain encoded strings (driving / walking,
    // single colour for the whole route) or coloured segments (transit,
    // each leg drawn in its own line colour)
    const rawList = Array.isArray(routePolyline)
      ? routePolyline
      : [routePolyline];

    const segments: ColouredPolylineSegment[] = rawList
      .map((item): ColouredPolylineSegment | null => {
        if (typeof item === "string") {
          if (item.length === 0) return null;
          return { polyline: item, colour: routeColour ?? "#EF4444" };
        }
        if (item && typeof item === "object" && "polyline" in item) {
          return item;
        }
        return null;
      })
      .filter((s): s is ColouredPolylineSegment => s !== null);

    if (segments.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const newOverlays: google.maps.Polyline[] = [];
    const casings: google.maps.Polyline[] = [];

    segments.forEach(({ polyline: encoded, colour, dashed }) => {
      // a merged walking segment may carry several encoded polyline pieces, decode each piece and
      // concatenate them in order into a single continuous path
      const pieces = Array.isArray(encoded) ? encoded : [encoded];
      const path = pieces
        .filter((piece) => piece.length > 0)
        .flatMap((piece) => google.maps.geometry.encoding.decodePath(piece));

      // outline/casing polyline drawn first for contrast and visibility
      const casing = new google.maps.Polyline({
        path,
        strokeColor: "#FFFFFF",
        strokeWeight: 8,
        strokeOpacity: 0.9,
        zIndex: 1,
      });
      casing.setMap(map);
      casings.push(casing);

      const polyline = new google.maps.Polyline({
        path,
        strokeColor: dashed ? undefined : colour,
        strokeOpacity: dashed ? 0 : 1,
        strokeWeight: 5,
        zIndex: 2,
        // dashed walking segments use repeated icon symbols instead of a
        // solid stroke, matching how Google Maps renders walk legs
        icons: dashed
          ? [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  strokeColor: colour,
                  scale: 3,
                },
                offset: "0",
                repeat: "12px",
              },
            ]
          : undefined,
      });
      polyline.setMap(map);
      newOverlays.push(polyline);

      path.forEach((point) => bounds.extend(point));
    });

    // center the map on the combined bounds so the whole route is visible
    map.fitBounds(bounds, 80);

    setRouteOverlays(newOverlays);

    return () => {
      casings.forEach((casing) => casing.setMap(null));
    };
  }, [map, isLoaded, routePolyline, routeColour]);

  // clean up the route overlays when the map component unmounts
  useEffect(() => {
    return () => {
      routeOverlays.forEach((overlay) => overlay.setMap(null));
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        Loading Map...
      </div>
    );
  }

  return (
    <Map
      defaultZoom={12}
      defaultCenter={center}
      className="w-full h-full"
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
    >
      {/* attraction markers */}
      {attractions.map((attraction) => {
        const key = attraction.instanceId ?? attraction.placeId;
        const number = markerNumbers?.[key];

        return (
          <AdvancedMarker
            key={attraction.placeId}
            position={{ lat: attraction.lat, lng: attraction.lng }}
            onClick={() => onSelectAttraction(attraction)}
          >
            {number ? (
              <div
                style={{
                  backgroundColor: routeColour ?? "#EF4444",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                {number}
              </div>
            ) : undefined}
          </AdvancedMarker>
        );
      })}
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
  routeColour,
  markerNumbers,
}: {
  destination: string;
  attractions: Attraction[];
  center: { lat: number; lng: number };
  selectedAttraction: Attraction | null;
  onSelectAttraction: (attraction: Attraction | null) => void;
  routePolyline?: string | string[] | ColouredPolylineSegment[] | null;
  routeColour?: string;
  markerNumbers?: { [key: string]: number };
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
      markerNumbers={markerNumbers}
    />
  );
}
