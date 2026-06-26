import { prisma } from "@/lib/prisma";

type FollowStatus = "NONE" | "PENDING" | "ACCEPTED";

export async function followUser(followerId: string, followingId: string) {
    return await prisma.follow.create({
        data: { followerId, followingId, status: "PENDING" }
    });
}

export async function unfollowUser(followerId: string, followingId: string) {
    return await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } }
    });
}

export async function getFollowStatus(followerId: string, followingId: string): Promise<FollowStatus> {
    const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } }
    });
    return (follow?.status as FollowStatus) ?? "NONE";
}

export async function getFollowers(userId: string) {
    const followers = await prisma.follow.findMany({
        where: { followingId: userId, status: "ACCEPTED" },
        include: {
            following: { select: { id: true, name: true, imageUrl: true } }
        }
    });

    return await Promise.all(followers.map(async (f) => ({
        ...f.following,
        followBackStatus: await getFollowStatus(userId, f.followerId)
    })));
}

export async function getFollowing(userId: string) {
    const following = await prisma.follow.findMany({
        where: {followerId: userId, status: 'ACCEPTED'},
        include: {
            follower: { select: { id: true, name: true, imageUrl: true}}
        }
    })

    return await Promise.all(following.map(async (f) => ({
        ...f.follower,
        followBackStatus: await getFollowStatus(f.followingId, userId)
    })))
}

export async function getFollowRequests(userId: string) {
    const requests = await prisma.follow.findMany({
        where: { followingId: userId, status: "PENDING" },
        include: {
            following: { select: { id: true, name: true, imageUrl: true } }
        }
    });

    return requests.map((f) => f.following);
}

export async function respondToFollowRequest(requesterId: string, targetId: string, action: "ACCEPT" | "REJECT") {
    if (action === "ACCEPT") {
        return await prisma.follow.update({
            where: { followerId_followingId: { followerId: requesterId, followingId: targetId } },
            data: { status: "ACCEPTED" }
        });
    } else {
        return await prisma.follow.delete({
            where: { followerId_followingId: { followerId: requesterId, followingId: targetId } }
        });
    }
}

export async function searchUsers(query: string, currUserId: string) {
    const users = await prisma.user.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        select: { id: true, name: true, imageUrl: true }
    });

    return await Promise.all(users.map(async (u) => ({
        ...u,
        followStatus: await getFollowStatus(currUserId, u.id)
    })));
}

export async function getNumFollowers(userId: string) {
    return await prisma.follow.count({
        where: {followingId: userId, status: 'ACCEPTED'}
    })
}

export async function getNumFollowing(userId: string) {
    return await prisma.follow.count({
        where: {followerId: userId, status: 'ACCEPTED'}
    });
}

export async function getUserProfile(userId: string) {
    const numFollowers = await getNumFollowers(userId)
    const numFollowing = await getNumFollowing(userId)

    const userProfile = await prisma.user.findUnique({
        where: {id: userId},
        select: { name: true, email: true, imageUrl: true }
    })

    return {userProfile, numFollowers, numFollowing}
}