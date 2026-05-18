'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export default function DatePicker({ placeholder, className }: { placeholder: string, className?: string }) {
  const [date, setDate] = useState<Date>()

  return (
    <Popover>
        <PopoverTrigger className={`${className} h-full`}>
            <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                {date ? format(date, 'PPP') : <span className="text-gray-400">{placeholder}</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent>
            <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
    </Popover>
  )
}