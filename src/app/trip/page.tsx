import Map from "@/components/map/Map"

async function Trip({ searchParams } : { 
    searchParams: Promise<{ 
        destination: string 
        startDate: string
        endDate: string
    }>
}) {

    const { destination, startDate, endDate } = await searchParams;
    const start = new Date(startDate);
    const end = new Date(endDate);

    
    return (
        <main className="h-screen flex bg-[#F9F9F9]">
            <div className="p-8 w-1/3">
                <h1 className="text-4xl font-bold">The next station is {destination} LOL</h1>
                <p> From {start.toDateString()} to {end.toDateString()}</p>
            </div>
            <div className="w-2/3 h-full">
                <Map destination={destination} />
            </div>
        </main>
    )
}

export default Trip;