import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-red-50 flex flex-col items-center justify-center px-6 text-center py-24">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.08] mb-5">
        Plan trips together,<br className="hidden md:block" /> effortlessly.
      </h1>

      <p className="text-base md:text-lg text-gray-500 max-w-xl mb-9 leading-relaxed">
        AI-generated itineraries, real-time collaboration, and shared budget tracking.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/sign-up">
          <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-base shadow-sm shadow-red-200">
            Start Planning
          </button>
        </Link>
        <Link href="/login">
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3.5 rounded-full border border-gray-200 transition-colors text-base">
            Log In
          </button>
        </Link>
      </div>
    </div>
  );
}
