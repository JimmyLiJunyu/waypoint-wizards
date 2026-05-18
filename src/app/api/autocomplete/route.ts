import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')

  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&type=city&limit=5&apiKey=${process.env.GEOAPIFY_API_KEY}`
  )
  const data = await res.json()

  const suggestions = data.features.map((f: any) => ({
    name: f.properties.city || f.properties.name,
    country: f.properties.country,
    placeId: f.properties.place_id
  }))
  .filter((suggestion: any, index: number, self: any[]) => 
    index === self.findIndex(s => s.name === suggestion.name && s.country === suggestion.country)
  )

  return NextResponse.json({ suggestions })
}