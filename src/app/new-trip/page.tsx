import TripForm from "@/components/TripForm";

function NewTrip() {
    return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-[20vh]">
        <h1 className="text-4xl font-bold">Plan a new trip</h1>
        <TripForm />
    </main>
    )
}

export default NewTrip;