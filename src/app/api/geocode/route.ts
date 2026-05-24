import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination!)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )
  const data = await res.json();

  const location = data.results[0].geometry.location;

  return NextResponse.json({ location });
}