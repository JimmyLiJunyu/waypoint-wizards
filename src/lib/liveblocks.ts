import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client"
import { createRoomContext } from "@liveblocks/react"

export type AttractionEntry = {
    placeId: string;
    instanceId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number;
    reviews: number;
    photoRef?: string;
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

export const { RoomProvider, useStorage, useMutation, useMyPresence, useOthers, useSelf, useRoom } = createRoomContext<Presence, Storage>(client)