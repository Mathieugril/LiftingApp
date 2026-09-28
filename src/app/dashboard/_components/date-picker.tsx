"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fromDateParam, toDateParam } from "@/lib/dates";

export function DatePicker({ selected }: { selected: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selectedDate = selected ? fromDateParam(selected) : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    setOpen(false);
    const params = new URLSearchParams({
      date: toDateParam(date),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    router.push(`/dashboard?${params}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" />}>
        <CalendarIcon data-icon="inline-start" />
        <span suppressHydrationWarning>
          {selectedDate
            ? selectedDate.toLocaleDateString(undefined, { dateStyle: "medium" })
            : "Pick a date"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={handleSelect}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
