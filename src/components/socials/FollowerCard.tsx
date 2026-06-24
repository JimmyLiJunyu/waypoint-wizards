"use client"

import { useRouter } from 'next/navigation'
import { User } from "lucide-react"
import Image from "next/image"
import { useState } from 'react'

interface FollowerCardProps {
    id: string,
    name: string,
    imageUrl: string | null,
    followBackStatus: "NONE" | "PENDING" | "ACCEPTED"
}

export default function FollowerCard({ id, name, imageUrl, followBackStatus }: FollowerCardProps) {
    const [followStatus, setFollowStatus] = useState(followBackStatus)
    const router = useRouter()
    async function handleFollowback(e: React.MouseEvent) {
        e.stopPropagation()
        const response = await fetch(`/api/users/${id}/follow`, {
            method: "POST"
        })
        if (response.ok) setFollowStatus("PENDING")
    }
    
    return (
        <div onClick={() => router.push(`/users/${id}`)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
            {imageUrl
                ? <Image src={imageUrl} alt={name} width={40} height={40} className="rounded-full object-cover"/>
                : <User className="size-5"/>
            }
            <span className="font-medium">{name}</span>
            {
            followStatus === "ACCEPTED" && <span className="text-sm text-gray-400">Following</span>}
            {followStatus === "PENDING" && <span className="text-sm text-gray-400">Requested</span>}
            {followStatus === "NONE" && (
                <button onClick={handleFollowback} className="text-sm px-3 py-1 rounded-full bg-blue-500 text-white hovering:bg-blue-600">
                    Follow Back
                </button>
            )}
        </div>
    )
}