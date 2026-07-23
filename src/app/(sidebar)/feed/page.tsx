import { getCurrUserId } from "@/lib/auth/session";
import { getFeedPosts } from "@/services/feedServices";
import { redirect } from "next/navigation";
import PostCard from "@/components/feed/PostCard";

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
            <p className="text-gray-500 text-sm">
              Follow some friends to see their trips here.
            </p>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currUserId} />
          ))}
        </div>
      </div>
    </main>
  );
}
