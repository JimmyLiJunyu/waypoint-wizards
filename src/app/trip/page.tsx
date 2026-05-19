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
        <main className="min-h-screen flex flex-col bg-[#F9F9F9]">
            <div className="p-8">
                <h1 className="text-4xl font-bold">The next station is {destination} LOL</h1>
                <p> From {start.toDateString()} to {end.toDateString()}</p>
            </div>
        </main>
    )
}

export default Trip;