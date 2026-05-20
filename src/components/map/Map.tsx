'use client'
import { GoogleMap, useLoadScript } from '@react-google-maps/api'
import { useState, useEffect } from 'react'

export default function Map({ destination }: { destination: string }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  })

  const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 });

  useEffect(() => {
    async function geocode() {
        const res = await fetch(`/api/geocode?destination=${encodeURIComponent(destination)}`);
        const data = await res.json();
        setCenter(data.location);
    }
    geocode()
  }, [destination])

  if (!isLoaded) {
    return (
        <div>
            Loading Map...
        </div>
    )
  }

  return (
    <GoogleMap
      zoom={12}
      center={center}
      mapContainerClassName="w-full h-screen"
    />
  )
}