'use client'
import { GoogleMap, useLoadScript } from '@react-google-maps/api'

export default function Map({ destination }: { destination: string }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  })

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
      center={{ lat: 1.3521, lng: 103.8198 }}
      mapContainerClassName="w-full h-screen"
    />
  )
}