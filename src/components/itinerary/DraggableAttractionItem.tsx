import { useDraggable } from '@dnd-kit/core';
import { Attraction } from '@/types/attractions';
import { CSS } from '@dnd-kit/utilities';

function DraggableAttractionItem({ attraction, isSelected, onClick, cardRef } : { 
    attraction: Attraction;
    isSelected: boolean;
    onClick: () => void;
    cardRef: (el: HTMLDivElement | null) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: attraction.placeId,
        data: { attraction, source: 'list' }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={(el) => { setNodeRef(el); cardRef(el); }}
            style={style}
            {...attributes}
            {...listeners}
            className={`border p-3 rounded-lg bg-white cursor-grab active:cursor-grabbing select-none transition-colors ${isSelected ? 'border-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
            onClick={onClick}>
            <h3 className='font-semibold'> {attraction.name} </h3>
            <p className='text-gray-500 text-sm'> {attraction.address} </p>
            <p className='text-sm'> Rating: {attraction.rating} ⭐ ({attraction.reviews} reviews)</p>
        </div>
    )
}

export default DraggableAttractionItem;