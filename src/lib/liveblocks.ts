import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client"
import { createRoomContext } from "@liveblocks/react"
import { Liveblocks as LiveblocksNode } from "@liveblocks/node"

export type AttractionEntry = {
    placeId: string;
    instanceId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number;
    reviews: number;
}

export type Presence = {
    cursor: { x: number; y: number } | null;
    name: string;
    imageUrl: string | null
}

export type Storage = {
    itinerary: LiveMap<string, LiveList<LiveObject<AttractionEntry>>>;
}

const client = createClient({
    authEndpoint: "/api/liveblocks-auth"
})

export const { RoomProvider, useStorage, useMutation, useMyPresence, useOthers, useSelf } = createRoomContext<Presence, Storage>(client)

export const liveblocks = new LiveblocksNode({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})