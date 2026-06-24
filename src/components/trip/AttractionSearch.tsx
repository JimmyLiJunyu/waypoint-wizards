'use client'
import { useState, useEffect, useRef } from "react";
import { Attraction } from "@/types/attractions";

const DEBOUNCE_MS = 350;

function AttractionSearch({ lat, lng, onResults } : {
    lat: number;
    lng: number;
    onResults: (attractions: Attraction[]) => void
}) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // tracks whether the most recent search was triggered by the debounce effect
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function runSearch(searchQuery: string) {
        if (!searchQuery) {
            // query cleared to restore the default nearby attractions list
            setIsLoading(true);
            const response = await fetch(`/api/attractions?lat=${lat}&lng=${lng}`);
            const data = await response.json();
            onResults(data.attractions);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const response = await fetch(`/api/attractions?lat=${lat}&lng=${lng}&query=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        onResults(data.attractions);
        setIsLoading(false);
    }

    // search as the user types
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            runSearch(query);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [query]);

    // manual search trigger
    function handleSearch() {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        runSearch(query);
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