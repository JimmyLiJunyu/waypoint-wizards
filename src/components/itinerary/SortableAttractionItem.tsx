import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Attraction } from '@/types/attractions';

function SortableAttractionItem({ attraction, onRemove } : { 
    attraction: Attraction;
    onRemove: (instanceId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: attraction.instanceId!,
        data: { attraction, source: 'itinerary' }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className='bg-gray-50 border rounded-lg p-2 flex items-center justify-between group select-none'>
            <div {...listeners} className='flex-1 cursor-grab active:cursor-grabbing'>
                <p className='font-semibold text-sm'> {attraction.name} </p>
                <p className='text-gray-500 text-xs'> {attraction.rating} ⭐ </p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(attraction.instanceId!);
                }}
                className='bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md ml-2 flex-shrink-0 transition-colors'>
                Remove
            </button>
        </div>
        )
}

export default SortableAttractionItem;