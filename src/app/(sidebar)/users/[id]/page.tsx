import { getUserProfile } from '@/services/socialsServices'
import { getUserPosts } from '@/services/feedServices'
import { getCurrUserId } from '@/lib/auth/session'
import { User } from 'lucide-react'
import Image from 'next/image'
import PostCard from '@/components/feed/PostCard'

export default async function Profile({ params }: { params: Promise<{id: string}> }) {
    const { id } = await params
    const currUserId = await getCurrUserId()
    const { userProfile, numFollowers, numFollowing } = await getUserProfile(id)
    const posts = await getUserPosts(id)

    return (
        <main className="min-h-screen bg-[#F9F9F9] p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center gap-6">
                    {userProfile?.imageUrl
                        ? <Image src={userProfile?.imageUrl} alt={userProfile?.name ?? "User"} width={96} height={96} className="rounded-full object-cover"/>
                        : <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="size-10 text-gray-500"/>
                        </div>
                    }

                    <div>
                        <h1 className="text-2xl font-bold">{userProfile?.name}</h1>
                        <div className="flex gap-6 mt-2 text-gray-500 text-sm">
                            <span>
                                <strong className="text-black">{numFollowers}</strong> followers
                            </span>
                            <span>
                                <strong className="text-black">{numFollowing}</strong> following
                            </span>
                        </div>
                    </div>

                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Posts</h2>
                    <div className="flex flex-col gap-6">
                        {posts.length === 0 && (
                            <p className="text-gray-500 text-sm">No posts yet.</p>
                        )}
                        {currUserId && posts.map((post) => (
                            <PostCard key={post.id} post={post} currentUserId={currUserId} />
                        ))}
                    </div>
                </div>

            </div>

        </main>
    )
}