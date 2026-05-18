'use client'

import { useState } from "react"
import DatePicker from "../ui/DatePicker";
import DestinationInput from "./DestinationInput";

function TripForm() {
    const [destination, setDestination] = useState("");
    // const [startDate, setStartDate] = useState("");
    // const [endDate, setEndDate] = useState("");

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
                <DatePicker placeholder="Start Date" className="flex-1" />
                <DatePicker placeholder="End Date" className="flex-1" />
            </div>
            <button className="bg-red-500 text-white p-3 rounded-full w-1/3 font-semibold self-center mt-4">
                Plan the Trip
            </button>
        </div>
    )
}

export default TripForm;