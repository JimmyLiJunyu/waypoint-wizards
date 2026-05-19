'use client'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export default function DatePicker({ placeholder, className, date, onSelect }: { 
  placeholder: string
  className?: string
  date?: Date
  onSelect: (date: Date | undefined) => void
}) {
  return (
    <Popover>
      <PopoverTrigger className={`${className} h-full`}>
        <div>
          <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
            {date ? format(date, 'PPP') : <span className="text-gray-400">{placeholder}</span>}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={date} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
  )
}