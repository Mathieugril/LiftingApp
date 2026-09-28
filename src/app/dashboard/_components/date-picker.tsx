"use client";

import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fromDateParam, toDateParam } from "@/lib/dates";

export function DatePicker({ selected }: { selected: string | null }) {
  const router = useRouter();
  const selectedDate = selected ? fromDateParam(selected) : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const params = new URLSearchParams({
      date: toDateParam(date),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    router.push(`/dashboard?${params}`);
  }

  return (
    <Card className="w-fit shrink-0">
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={handleSelect}
          disabled={{ after: new Date() }}
        />
      </CardContent>
    </Card>
  );
}
