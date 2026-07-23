import { getUserProfile } from '@/services/socialsServices'
import { getUserPosts } from '@/services/feedServices'
import { areMutualFollowers } from '@/services/messagingServices'
import { getCurrUserId } from '@/lib/auth/session'
import { User } from 'lucide-react'
import Image from 'next/image'
import PostCard from '@/components/feed/PostCard'
import ProfileFollowStats from '@/components/socials/ProfileFollowStats'
import MessageButton from '@/components/messages/MessageButton'

export default async function Profile({ params }: { params: Promise<{id: string}> }) {
    const { id } = await params
    const currUserId = await getCurrUserId()
    const { userProfile, numFollowers, numFollowing } = await getUserProfile(id)
    const posts = await getUserPosts(id)
    const canMessage = currUserId && currUserId !== id && (await areMutualFollowers(currUserId, id))

    return (
        <main className="h-full bg-[#F9F9F9] p-8 flex flex-col overflow-hidden">
            <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
                <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center gap-6 shrink-0">
                    {userProfile?.imageUrl
                        ? <Image src={userProfile?.imageUrl} alt={userProfile?.name ?? "User"} width={96} height={96} className="rounded-full object-cover"/>
                        : <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="size-10 text-gray-500"/>
                        </div>
                    }

                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{userProfile?.name}</h1>
                            {canMessage && <MessageButton otherUserId={id} />}
                        </div>
                        <ProfileFollowStats userId={id} numFollowers={numFollowers} numFollowing={numFollowing} />
                    </div>

                </div>

                <div className="mt-8 flex flex-col flex-1 min-h-0">
                    <h2 className="text-xl font-bold mb-4 shrink-0">Posts</h2>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6">
                        {posts.length === 0 && (
                            <p className="text-gray-500 text-sm">No posts yet.</p>
                        )}
                        {currUserId && posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={currUserId}
                                canManage={currUserId === id}
                            />
                        ))}
                    </div>
                </div>

            </div>

        </main>
    )
}