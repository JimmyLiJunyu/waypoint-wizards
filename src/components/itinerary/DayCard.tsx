import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Attraction } from '@/types/attractions';
import SortableAttractionItem from './SortableAttractionItem';

function DayCard({ day, date, attractions, onRemove } : {
    day: number;
    date: Date;
    attractions: Attraction[];
    onRemove: (instanceId: string) => void
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });

    return (
        <div className='bg-white border rounded-xl p-4 mb-3'>
            <h3 className='font-bold text-lg mb-1'> Day {day} </h3>
            <p className='text-gray-500 text-sm mb-3'> {date.toDateString()} </p>
            <div
                ref={setNodeRef}
                className={`min-h-24 rounded-lg border-2 border-dashed p-2 flex flex-col gap-2 transition-colors ${isOver ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                    {/* attractions inside each daycard is sortable */}
                    <SortableContext
                        items={attractions.map(a => a.instanceId!)}
                        strategy={verticalListSortingStrategy}>
                        {attractions.length === 0 ? (
                            <p className='text-gray-400 text-sm text-center py-4'>Drop attractions here</p>
                        ) : (
                            <>
                                {attractions.map((attraction) => (
                                    <SortableAttractionItem key={attraction.placeId} attraction={attraction} onRemove={onRemove} />
                                ))}
                                <div className='min-h-8' />
                            </>
                        )}
                    </SortableContext>
            </div>
        </div>
    )
}

export default DayCard;