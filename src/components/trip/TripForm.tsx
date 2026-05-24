'use client'

import { useState } from "react"
import DatePicker from "../ui/DatePicker";
import DestinationInput from "./DestinationInput";
import { useRouter } from "next/navigation";

function TripForm() {
    const [destination, setDestination] = useState("");
    // const [startDate, setStartDate] = useState("");
    // const [endDate, setEndDate] = useState("");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const router = useRouter();

    function handleSubmit() {
        if (!destination || !startDate || !endDate) {
            return;
        }
        router.push(`/trip?destination=${encodeURIComponent(destination)}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-md mt-8">
            {/* <input 
                className="border p-3 rounded-lg"
                placeholder="Where do you want to go?"
                value={destination} 
                onChange={e => setDestination(e.target.value)} /> */}
            <DestinationInput value={destination} onChange={setDestination} />
            {/* <div className="flex gap-4 w-full">
                <label className="text-sm text-gray-500">Start Date</label> 
                <input 
                    className="border p-3 rounded-lg flex-1 min-w-0"
                    type="date"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)} />
                <label className="text-sm text-gray-500">End Date</label>
                <input
                    className="border p-3 rounded-lg flex-1 min-w-0"
                    type="date"
                    placeholder="End Date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)} />
            </div> */}
            <div className="flex gap-4 w-full items-stretch">
                <DatePicker placeholder="Start Date" className="flex-1" date={startDate} onSelect={setStartDate}/>
                <DatePicker placeholder="End Date" className="flex-1" date={endDate} onSelect={setEndDate}/>
            </div>
            <button className="bg-red-500 text-white p-3 rounded-full w-1/3 font-semibold self-center mt-4"
                onClick={handleSubmit}>
                Plan the Trip
            </button>
        </div>
    )
}

export default TripForm;