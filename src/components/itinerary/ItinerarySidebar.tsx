import { DragOverlay } from "@dnd-kit/core";
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
}: {
  startDate: string;
  endDate: string;
  itinerary: { [day: number]: Attraction[] };
  isOpen: boolean;
  onRemove: (instanceId: string) => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-160 h-screen bg-[#F9F9F9] border-l p-4 overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Itinerary</h2>
        <button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors
      ${
        hasUnsavedChanges
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-gray-100 text-gray-400 cursor-default"
      }`}
        >
          {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved ✓"}
        </button>
      </div>
      {days.map((date, index) => (
        <DayCard
          key={index}
          day={index + 1}
          date={date}
          attractions={itinerary[index + 1] ?? []}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export default ItinerarySidebar;
