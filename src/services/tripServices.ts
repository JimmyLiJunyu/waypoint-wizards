import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface CreateItineraryInput {
    title: string,
    userId: number,
    destination: string,
    startDate: Date,
    endDate: Date
}

export async function createItinerary({title, userId, destination, startDate, endDate}: CreateItineraryInput) {
    return await prisma.itinerary.create({
        data: {
            title: title,
            collaborators: {
                create: {
                    userId: userId,
                    role: "OWNER",
                },
            },
            location: destination,
            startDate: startDate,
            endDate: endDate
        },

        include: {
            collaborators: true,
            destinations: true
        }
    });
}