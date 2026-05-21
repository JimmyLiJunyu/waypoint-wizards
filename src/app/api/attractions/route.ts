import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const query = searchParams.get('query') || 'tourist attraction'

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}+in+${lat},${lng}&location=${lat},${lng}&radius=5000&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )
  const data = await res.json()

  const attractions = data.results.map((place: any) => ({
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating,
    address: place.formatted_address,
    reviews: place.user_ratings_total ?? 0,
    placeId: place.place_id
  }))

  return NextResponse.json({ attractions })
}