import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-[#FFFDD0] font-sans">
      <h1>Waypoint</h1>
      <h2>Plan the perfect trip!</h2>
      <Link href="/new-trip">
        <button className="bg-red-500 text-white px-6 py-3 rounded-full mt-7">Start Planning</button>
      </Link>
    </div>
  );
}
