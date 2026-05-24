'use client'

import { useState } from "react"

interface Suggestion {
    name: string;
    country: string;
    placeId: string;
}

function DestinationInput({ value, onChange} : {
    value: string;
    onChange: (value: string) => void;
}) {

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [dropdown, setDropdown] = useState(false);

    async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.target.value;
        onChange(input);

        if (input.length < 1) {
            setSuggestions([]);
            setDropdown(false);
            return
        }

        const response = await fetch(`/api/autocomplete?query=${input}`);
        const data = await response.json();
        setSuggestions(data.suggestions);
        setDropdown(true);
    }
    
    function handleSelect(suggestion: Suggestion) {
        onChange(suggestion.name + ', ' + suggestion.country);
        setSuggestions([]);
        setDropdown(false);
    }

    return (
        <div className="relative w-full">
            <input
                className="border p-3 rounded-lg w-full h-12"
                placeholder="Where do you want to go?"
                value={value}
                onChange={handleChange}
            />
            {dropdown && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
                    {suggestions.map(sgst => (
                        <div
                        key={sgst.placeId}
                        className="p-3 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelect(sgst)}
                        >
                            {sgst.name}, {sgst.country}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DestinationInput;