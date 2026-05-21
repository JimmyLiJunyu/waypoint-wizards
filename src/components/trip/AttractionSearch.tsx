'use client'
import { useState } from "react";

interface Attraction {
    name: string;
    lat: number;
    lng: number;
    rating: number;
    address: string;
    reviews: number;
    placeId: string;
}

function AttractionSearch({ lat, lng, onResults } : {
    lat: number;
    lng: number;
    onResults: (attractions: Attraction[]) => void
}) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSearch() {
        if (!query) {
            return;
        }
        setIsLoading(true);
        const response = await fetch(`/api/attractions?lat=${lat}&lng=${lng}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        onResults(data.attractions);
        setIsLoading(false);
    }

    return (
    <div className="flex gap-2 mt-4">
        <input
            className="border p-2 rounded-lg flex-1"
            placeholder="Search attractions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 rounded-lg disabled:bg-red-300">
            {isLoading ? 'Searching...' : 'Search'}
        </button>
    </div>
    )
}

export default AttractionSearch;