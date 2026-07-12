import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'missing ref' }, { status: 400 })

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )

  const blob = await res.blob()
  return new NextResponse(blob, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
