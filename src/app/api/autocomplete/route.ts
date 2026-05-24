import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=(cities)&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )
  const data = await res.json()

  console.log('Google response:', JSON.stringify(data))

  const suggestions = data.predictions.map((p: any) => ({
    name: p.structured_formatting.main_text,
    country: p.structured_formatting.secondary_text,
    placeId: p.place_id
  }))

  return NextResponse.json({ suggestions })
}