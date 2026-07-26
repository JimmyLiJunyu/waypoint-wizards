"use client";
import {
  Map,
  useApiIsLoaded,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
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
  panTarget,
  routePolyline,
  routeColour,
  markerNumbers,
}: {
  center: { lat: number; lng: number };
  attractions: Attraction[];
  selectedAttraction: Attraction | null;
  onSelectAttraction: (attraction: Attraction | null) => void;
  panTarget?: Attraction | null;
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

  // only pan when a card in the list is clicked (panTarget), not when a map pin is clicked
  useEffect(() => {
    if (map && panTarget) {
      map.panTo({ lat: panTarget.lat, lng: panTarget.lng });
    }
  }, [map, panTarget]);

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

    // Animate pan from current centre to new route centre, then fit bounds for zoom
    const startCenter = map.getCenter()!;
    const targetCenter = bounds.getCenter();
    const DURATION = 650;
    const t0 = performance.now();
    let raf: number;

    const step = (now: number) => {
      const raw = Math.min((now - t0) / DURATION, 1);
      const ease = 1 - Math.pow(1 - raw, 3); // ease-out cubic
      map.setCenter({
        lat: startCenter.lat() + (targetCenter.lat() - startCenter.lat()) * ease,
        lng: startCenter.lng() + (targetCenter.lng() - startCenter.lng()) * ease,
      });
      if (raw < 1) {
        raf = requestAnimationFrame(step);
      } else {
        map.fitBounds(bounds, 80);
      }
    };
    raf = requestAnimationFrame(step);

    setRouteOverlays(newOverlays);

    return () => {
      casings.forEach((casing) => casing.setMap(null));
      cancelAnimationFrame(raf);
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
            key={attraction.instanceId ?? attraction.placeId}
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
            ) : (
              <div className="relative">
                <MapPin size={36} className="text-red-600 fill-red-500 drop-shadow-md" strokeWidth={2} />
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full" />
              </div>
            )}
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
          <div className="w-48">
            {selectedAttraction.photoRef && (
              <img
                src={`/api/place-photo?ref=${selectedAttraction.photoRef}`}
                alt={selectedAttraction.name}
                className="w-full h-28 object-cover rounded mb-2"
              />
            )}
            <h2 className="font-semibold"> {selectedAttraction.name} </h2>
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
  panTarget,
  routePolyline,
  routeColour,
  markerNumbers,
}: {
  destination: string;
  attractions: Attraction[];
  center: { lat: number; lng: number };
  selectedAttraction: Attraction | null;
  onSelectAttraction: (attraction: Attraction | null) => void;
  panTarget?: Attraction | null;
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
      panTarget={panTarget}
      routePolyline={routePolyline}
      routeColour={routeColour}
      markerNumbers={markerNumbers}
    />
  );
}
