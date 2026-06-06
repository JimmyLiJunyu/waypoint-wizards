import TripClient from "@/components/trip/TripClient";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

async function Trip({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{
    destination: string;
    startDate: string;
    endDate: string;
  }>;
}) {
  const { tripId } = await params;
  const { destination, startDate, endDate } = await searchParams;
  
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: tripId },
    include: {
      itineraryItems: { orderBy: [{ dayNumber: "asc" }, { position: "asc" }] },
    },
  });

  if (!itinerary) return notFound();

  const savedItinerary: { [day: number]: Attraction[] } = {};
  for (const item of itinerary.itineraryItems) {
    if (!savedItinerary[item.dayNumber]) savedItinerary[item.dayNumber] = [];
    savedItinerary[item.dayNumber].push({
      placeId: item.placeId,
      instanceId: item.instanceId,
      name: item.name,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      rating: item.rating,
      reviews: item.reviews,
    });
  }

  return (
    <TripClient
      itineraryId={tripId}
      destination={destination}
      startDate={startDate}
      endDate={endDate}
      savedItinerary={savedItinerary}
    />
  );
}

export default Trip;
