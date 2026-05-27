
import Link from 'next/link';
import TripTable  from "@/components/tripTable/TripTable";
// need to replace this with actual data from database
// need to add api to fetch from database, then fetch from api
const placeholderTrips = [
    { id: '1', tripName: 'Tokyo Trip', createdAt: '2026-05-01' },
    { id: '2', tripName: 'Paris Trip', createdAt: '2026-05-02' },
    { id: '3', tripName: 'Bali Trip', createdAt: '2026-05-03' },
];

function Dashboard() {



    return (
        <main className='min-h-screen bg-[#F9F9F9] p-8'>
            <div className='max-w-4xl mx-auto'>
                <div className='flex items-center justify-between mb-8'>
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
                <TripTable/>
                
            </div>
        </main>
    )
}

export default Dashboard;
