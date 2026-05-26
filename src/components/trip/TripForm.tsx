"use client";

import { useState } from "react";
import DatePicker from "../ui/DatePicker";
import DestinationInput from "./DestinationInput";
import { useRouter } from "next/navigation";

function TripForm() {
  const [destination, setDestination] = useState("");
  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
// means cannot use enter to submit, might need debug
  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    //router.push(`/trip?destination=${encodeURIComponent(destination)}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)

    try {
      if (!destination || !startDate || !endDate) {
        throw new Error("Invalid fields!");
      }
      const response = await fetch("/api/new-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push(
          `/trip/${data.id}?destination=${encodeURIComponent(destination)}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        );
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mt-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded text-sm border border-red-200">
          {error}
        </div>
      )}
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
        <DatePicker
          placeholder="Start Date"
          className="flex-1"
          date={startDate}
          onSelect={setStartDate}
        />
        <DatePicker
          placeholder="End Date"
          className="flex-1"
          date={endDate}
          onSelect={setEndDate}
        />
      </div>
      <button
        className="bg-red-500 text-white p-3 rounded-full w-1/3 font-semibold self-center mt-4"
        type="button" onClick={handleSubmit} disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Plan the Trip"}
      </button>
    </div>
  );
}

export default TripForm;
