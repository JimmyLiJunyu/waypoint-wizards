"use client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DatePicker({
  placeholder,
  className,
  date,
  onSelect,
}: {
  placeholder: string;
  className?: string;
  date?: Date;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full h-12 justify-start text-left font-normal",
              className,
            )}
          />
        }
      >
        {date ? (
          format(date, "PPP")
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={date} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
  );
}
