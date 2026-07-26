import { getCurrUserId } from "@/lib/auth/session";
import { getFeedPosts } from "@/services/feedServices";
import { redirect } from "next/navigation";
import PostCard from "@/components/feed/PostCard";
import Link from "next/link";

export default async function FeedPage() {
  const currUserId = await getCurrUserId();
  if (!currUserId) redirect("/login");

  const posts = await getFeedPosts(currUserId);

  return (
    <main className="h-full bg-[#F9F9F9] p-8 flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <div className="mb-8 shrink-0">
          <h1 className="text-4xl font-bold">Feed</h1>
          <p className="text-gray-500 mt-1">Trips from people you follow</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6">
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-5xl mb-4">🗺️</p>
              <h3 className="text-lg font-semibold text-gray-600 mb-1">Nothing here yet</h3>
              <p className="text-gray-400 text-sm mb-5">Follow friends to see their trips in your feed.</p>
              <Link href="/socials">
                <button className="bg-red-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors">
                  Find People to Follow
                </button>
              </Link>
            </div>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currUserId} />
          ))}
        </div>
      </div>
    </main>
  );
}
