"use client"

import { useRouter } from 'next/navigation'
import { User } from "lucide-react"
import Image from "next/image"

interface FollowerCardProps {
    id: string,
    name: string,
    imageUrl: string | null
}

export default function FollowerCard({ id, name, imageUrl }: FollowerCardProps) {
    const router = useRouter()
    
    return (
        <div onClick={() => router.push(`/users/${id}`)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
            {imageUrl
                ? <Image src={imageUrl} alt={name} width={40} height={40} className="rounded-full object-cover"/>
                : <User className="size-5"/>
            }
            <span className="font-medium">{name}</span>
        </div>
    )
}