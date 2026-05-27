import { DragOverlay } from '@dnd-kit/core';
import DayCard from './DayCard';
import { Attraction } from '@/types/attractions';

function ItinerarySidebar({
    startDate,
    endDate,
    itinerary,
    isOpen
} : {
    startDate: string;
    endDate: string;
    itinerary: { [day: number]: Attraction[] };
    isOpen: boolean;
}) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const days = Array.from({ length: numDays }, (_, i) => {
        const date = new Date(start)
        date.setDate(date.getDate() + i)
        return date
    });

    if (!isOpen) {
        return null;
    }

    return (
        <div className='w-160 h-screen bg-[#F9F9F9] border-l p-4 overflow-y-auto flex-shrink-0'>
            <h2 className='text-2xl font-bold mb-4'> Itinerary </h2>
            {days.map((date, index) => (
                <DayCard
                key={index}
                day={index + 1}
                date={date}
                attractions={itinerary[index + 1] ?? []}
                />
            ))}
        </div>
    )
}

export default ItinerarySidebar;