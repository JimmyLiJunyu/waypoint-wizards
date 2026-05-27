import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Attraction } from '@/types/attractions';

function SortableAttractionItem({ attraction } : { attraction: Attraction }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id: attraction.placeId});

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
            {...listeners}
            className='bg-gray-50 border rounded-lg p-2 cursor-grab active:cursor-grabbing'>
            <p className='font-semibold text-sm'> {attraction.name} </p>
            <p className='text-gray-500 text-xs'> {attraction.rating} ⭐ </p>
        </div>
        )
}

export default SortableAttractionItem;