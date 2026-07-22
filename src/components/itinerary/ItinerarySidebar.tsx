import { useRef, useEffect, useState } from "react";
import DayCard from "./DayCard";
import { Attraction } from "@/types/attractions";

function ItinerarySidebar({
  startDate,
  endDate,
  itinerary,
  isOpen,
  onRemove,
  onSave,
  isSaving,
  hasUnsavedChanges,
  onAiGenerate,
  isGenerating,
  skippedPlaces,
  dayNotes,
  onUpdateNote,
  onClear,
}: {
  startDate: string;
  endDate: string;
  itinerary: { [day: number]: Attraction[] };
  isOpen: boolean;
  onRemove: (instanceId: string) => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onAiGenerate: (mode: "scratch" | "ontop") => void;
  isGenerating: boolean;
  skippedPlaces: string[];
  dayNotes: { [day: number]: string };
  onUpdateNote: (day: number, note: string) => void;
  onClear: () => void;
}) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const numDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const days = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date;
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="w-full md:w-160 h-full bg-[#F9F9F9] border-l p-4 overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Itinerary</h2>
        <div className="flex items-center gap-2">
          {/* AI Generate button */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "✨ AI Generate"}
            </button>
            {dropdownOpen && !isGenerating && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { setDropdownOpen(false); onAiGenerate("scratch"); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold text-gray-800">Create from scratch</p>
                  <p className="text-xs text-gray-400 mt-0.5">Replaces your current itinerary</p>
                </button>
                <div className="border-t" />
                <button
                  onClick={() => { setDropdownOpen(false); onAiGenerate("ontop"); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold text-gray-800">Build on top</p>
                  <p className="text-xs text-gray-400 mt-0.5">Only fills empty days</p>
                </button>
              </div>
            )}
          </div>

          {/* Clear button */}
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>

          {/* Save button */}
          <button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors
            ${hasUnsavedChanges
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-100 text-gray-400 cursor-default"
            }`}
          >
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved ✓"}
          </button>
        </div>
      </div>

      {/* Skipped places notice */}
      {skippedPlaces.length > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          <span className="font-semibold">⚠️ {skippedPlaces.length} place{skippedPlaces.length > 1 ? "s" : ""} couldn&apos;t be found and were skipped: </span>
          {skippedPlaces.join(", ")}
        </div>
      )}

      {days.map((date, index) => (
        <DayCard
          key={index}
          day={index + 1}
          date={date}
          attractions={itinerary[index + 1] ?? []}
          onRemove={onRemove}
          note={dayNotes[index + 1] ?? ""}
          onUpdateNote={onUpdateNote}
        />
      ))}
    </div>
  );
}

export default ItinerarySidebar;
