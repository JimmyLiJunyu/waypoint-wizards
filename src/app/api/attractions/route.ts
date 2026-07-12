import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const query = searchParams.get('query') || 'tourist attraction'

  const isDefaultQuery = !searchParams.get('query')
  const url = isDefaultQuery
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+tourist+attractions&location=${lat},${lng}&radius=50000&key=${process.env.GOOGLE_MAPS_API_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${lat},${lng}&radius=50000&key=${process.env.GOOGLE_MAPS_API_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  const MIN_REVIEWS = isDefaultQuery ? 200 : 0

  const attractions = data.results
    .filter((place: any) => (place.user_ratings_total ?? 0) >= MIN_REVIEWS)
    .map((place: any) => ({
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating,
      address: place.formatted_address,
      reviews: place.user_ratings_total ?? 0,
      placeId: place.place_id,
      photoRef: place.photos?.[0]?.photo_reference ?? null,
    }))

  return NextResponse.json({ attractions })
}
