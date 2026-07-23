
import Link from 'next/link';
import TripTable  from "@/components/tripTable/TripTable";


function Dashboard() {



    return (
        <main className='h-full bg-[#F9F9F9] p-8 flex flex-col overflow-hidden'>
            <div className='max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0'>
                <div className='flex items-center justify-between mb-8 shrink-0'>
                    <div>
                        <h1 className="text-4xl font-bold">My Trips</h1>
                        <p className="text-gray-500 mt-1">Here are your trips</p>
                    </div>
                    <Link href="/new-trip">
                        <button className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition-colors">
                            + Plan New Trip
                        </button>
                    </Link>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <TripTable/>
                </div>
            </div>
        </main>
    )
}

export default Dashboard;
