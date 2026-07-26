"use client";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Attraction } from '@/types/attractions';
import SortableAttractionItem from './SortableAttractionItem';
import { useState, useEffect } from 'react';

function DayCard({ day, date, attractions, onRemove, note, onUpdateNote } : {
    day: number;
    date: Date;
    attractions: Attraction[];
    onRemove: (instanceId: string) => void;
    note: string;
    onUpdateNote: (day: number, note: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });
    const [localNote, setLocalNote] = useState(note);

    // Sync if the note changes externally (e.g. AI generate or clear)
    useEffect(() => {
        setLocalNote(note);
    }, [note]);

    // Debounce writes to Liveblocks
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localNote !== note) onUpdateNote(day, localNote);
        }, 400);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localNote]);

    return (
        <div className='bg-white border rounded-xl p-4 mb-3'>
            <h3 className='font-bold text-lg mb-1'> Day {day} </h3>
            <p className='text-gray-500 text-sm mb-3'> {date.toDateString()} </p>
            <div
                ref={setNodeRef}
                className={`min-h-24 rounded-lg border-2 border-dashed p-2 flex flex-col gap-2 transition-colors ${isOver ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                    <SortableContext
                        items={attractions.map(a => a.instanceId!)}
                        strategy={verticalListSortingStrategy}>
                        {attractions.length === 0 ? (
                            <p className='text-gray-400 text-sm text-center py-4'>Drop attractions here</p>
                        ) : (
                            <>
                                {attractions.map((attraction) => (
                                    <SortableAttractionItem key={attraction.instanceId ?? attraction.placeId} attraction={attraction} onRemove={onRemove} />
                                ))}
                                <div className='min-h-8' />
                            </>
                        )}
                    </SortableContext>
            </div>
            <textarea
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder={`Add notes for Day ${day}...`}
                rows={2}
                className='mt-3 w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-red-300 focus:border-red-300 transition-colors'
            />
        </div>
    )
}

export default DayCard;
