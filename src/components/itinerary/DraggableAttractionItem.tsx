import { useDraggable } from '@dnd-kit/core';
import { Attraction } from '@/types/attractions';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import { Plus, Check } from 'lucide-react';

function DraggableAttractionItem({ attraction, isSelected, onClick, cardRef, numDays, onAddToDay } : {
    attraction: Attraction;
    isSelected: boolean;
    onClick: () => void;
    cardRef: (el: HTMLDivElement | null) => void;
    numDays: number;
    onAddToDay: (dayNumber: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: attraction.placeId,
        data: { attraction, source: 'list' }
    });

    const [pickerOpen, setPickerOpen] = useState(false);
    const [confirmedDay, setConfirmedDay] = useState<number | null>(null);
    const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        };
    }, []);

    function handleAddToDay(day: number) {
        onAddToDay(day);
        setPickerOpen(false);
        setConfirmedDay(day);
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = setTimeout(() => setConfirmedDay(null), 1500);
    }

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={(el) => { setNodeRef(el); cardRef(el); }}
            style={style}
            {...attributes}
            {...listeners}
            className={`border p-3 rounded-lg bg-white cursor-grab active:cursor-grabbing select-none transition-colors ${isSelected ? 'border-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
            onClick={onClick}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className='font-semibold'> {attraction.name} </h3>
                    <p className='text-gray-500 text-sm'> {attraction.address} </p>
                    <p className='text-sm'> Rating: {attraction.rating} ⭐ ({attraction.reviews} reviews)</p>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); setPickerOpen((p) => !p); }}
                    aria-label="Add to day"
                    className="md:hidden shrink-0 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                    <Plus className="size-4" />
                </button>
            </div>

            {pickerOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="md:hidden mt-2 pt-2 border-t flex flex-wrap gap-1.5"
                >
                    {Array.from({ length: numDays }, (_, i) => i + 1).map((day) => (
                        <button
                            key={day}
                            onClick={() => handleAddToDay(day)}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            Day {day}
                        </button>
                    ))}
                </div>
            )}

            {confirmedDay !== null && (
                <div className="md:hidden mt-2 pt-2 border-t flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                    <Check className="size-3.5" />
                    Added to Day {confirmedDay}
                </div>
            )}
        </div>
    )
}

export default DraggableAttractionItem;
