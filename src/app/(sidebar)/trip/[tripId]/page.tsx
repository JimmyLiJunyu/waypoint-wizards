import TripClient from "@/components/trip/TripClient";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Attraction } from "@/types/attractions";
import { getCurrUserId } from "@/lib/auth/session"

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

  const currUserId = await getCurrUserId()
  if (!currUserId) redirect('/login')
  
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: tripId },
    include: {
      itineraryItems: { orderBy: [{ dayNumber: "asc" }, { position: "asc" }] },
      dayNotes: true,
    },
  });

  if (!itinerary) return notFound();

  const collabRecords = await prisma.collaborator.findMany({
    where: { itineraryId: tripId }
  })

  const currUserCollab = collabRecords.find((c) => c.userId === currUserId)
  if (!currUserCollab) return notFound()

  const users = await prisma.user.findMany({
    where: { id: { in: collabRecords.map((c) => c.userId) } },
    select: { id: true, name: true, imageUrl: true }
  })

  const collaborators = collabRecords.map((c) => ({
    id: c.id,
    role: c.role,
    userId: c.userId,
    user: users.find((u) => u.id === c.userId)!
  }))

  

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
      photoRef: item.photoRef ?? undefined,
    });
  }

  const savedDayNotes: { [day: number]: string } = {};
  for (const dn of itinerary.dayNotes) {
    if (dn.note) savedDayNotes[dn.dayNumber] = dn.note;
  }

  return (
    <TripClient
      itineraryId={tripId}
      destination={destination}
      startDate={startDate}
      endDate={endDate}
      savedItinerary={savedItinerary}
      savedDayNotes={savedDayNotes}
      currentUserId={currUserId}
      currentUserRole={currUserCollab.role}
      collaborators={collaborators}
    />
  );
}

export default Trip;
