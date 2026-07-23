"use client"

import { useRouter } from 'next/navigation'
import { User } from "lucide-react"
import Image from "next/image"
import { useFollowStatus } from '@/hooks/useFollowStatus'
import FollowStatusButton from './FollowStatusButton'

interface FollowerCardProps {
    id: string,
    name: string,
    imageUrl: string | null,
    followBackStatus: "NONE" | "PENDING" | "ACCEPTED"
}

export default function FollowerCard({ id, name, imageUrl, followBackStatus }: FollowerCardProps) {
    const { status, follow, unfollow } = useFollowStatus(id, followBackStatus)
    const router = useRouter()

    return (
        <div onClick={() => router.push(`/users/${id}`)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
            {imageUrl
                ? <Image src={imageUrl} alt={name} width={40} height={40} className="rounded-full object-cover"/>
                : <User className="size-5"/>
            }
            <span className="font-medium flex-1">{name}</span>
            <FollowStatusButton
                status={status}
                name={name}
                onFollow={follow}
                onUnfollow={unfollow}
                noneLabel="Follow Back"
            />
        </div>
    )
}
