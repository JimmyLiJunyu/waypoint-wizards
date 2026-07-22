import { prisma } from "@/lib/prisma";

export async function getUserPosts(userId: string) {
    return await prisma.post.findMany({
        where: { ownerId: userId },
        include: {
            owner: { select: { id: true, name: true, imageUrl: true } },
            photo: true,
            postLike: { select: { userId: true } },
            itinerary: {
                select: {
                    id: true,
                    title: true,
                    location: true,
                    startDate: true,
                    endDate: true,
                    tripPhotos: true,
                    collaborators: {
                        include: { user: { select: { id: true, name: true, imageUrl: true } } }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getFeedPosts(currUserId: string) {
    const following = await prisma.follow.findMany({
        where: { followerId: currUserId, status: "ACCEPTED" },
        select: { followingId: true }
    });
    const visibleUserIds = following.map((f) => f.followingId);

    return await prisma.post.findMany({
        where: { ownerId: { in: visibleUserIds } },
        include: {
            owner: { select: { id: true, name: true, imageUrl: true } },
            photo: true,
            postLike: { select: { userId: true } },
            itinerary: {
                select: {
                    id: true,
                    title: true,
                    location: true,
                    startDate: true,
                    endDate: true,
                    tripPhotos: true,
                    collaborators: {
                        include: { user: { select: { id: true, name: true, imageUrl: true } } }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    });
}
