import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }>  }
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
      photoRef?: string;
    }[];
  } = body.itinerary;

  const dayNotes: { [day: number]: string } = body.dayNotes ?? {};

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
      rating: a.rating ?? 0,
      reviews: a.reviews,
      photoRef: a.photoRef ?? null,
      itineraryId,
    }))
  );

  const noteItems = Object.entries(dayNotes)
    .filter(([, note]) => note.trim())
    .map(([day, note]) => ({
      itineraryId,
      dayNumber: parseInt(day),
      note,
    }));

  await prisma.$transaction([
    prisma.itineraryItem.deleteMany({ where: { itineraryId } }),
    prisma.itineraryItem.createMany({ data: items }),
    prisma.dayNote.deleteMany({ where: { itineraryId } }),
    ...(noteItems.length > 0 ? [prisma.dayNote.createMany({ data: noteItems })] : []),
  ]);

  return NextResponse.json({ success: true });
}
