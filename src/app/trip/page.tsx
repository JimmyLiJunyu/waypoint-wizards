import Map from "@/components/map/Map";
import TripClient from "@/components/trip/TripClient";


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
        <TripClient
            destination={destination}
            startDate={startDate}
            endDate={endDate}
        />
    )
}

export default Trip;