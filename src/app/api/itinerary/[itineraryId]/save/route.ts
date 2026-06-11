import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { itineraryId: string } }
) {
  const { itineraryId } = await params;
  const body = await req.json();

  const itinerary: {
    [day: number]: {
      placeId: string;
      instanceId: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      rating: number;
      reviews: number;
    }[];
  } = body.itinerary;
  console.log('itineraryId:', itineraryId);
  console.log('body:', JSON.stringify(body));
  console.log('itinerary:', JSON.stringify(itinerary));

  const items = Object.entries(itinerary).flatMap(([day, attractions]) =>
    attractions.map((a, position) => ({
      dayNumber: parseInt(day),
      position,
      placeId: a.placeId,
      instanceId: a.instanceId ?? a.placeId,
      name: a.name,
      address: a.address,
      lat: a.lat,
      lng: a.lng,
      rating: a.rating,
      reviews: a.reviews,
      itineraryId,
    }))
  );

  // delete and replace
  await prisma.$transaction([
    prisma.itineraryItem.deleteMany({ where: { itineraryId } }),
    prisma.itineraryItem.createMany({ data: items }),
  ]);

  return NextResponse.json({ success: true });
}
