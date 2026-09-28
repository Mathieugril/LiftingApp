"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fromDateParam, toDateParam } from "@/lib/dates";

export function DatePicker({
  selected,
  workoutDates,
}: {
  selected: string | null;
  workoutDates: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedDate = selected ? fromDateParam(selected) : undefined;
  const workoutDayDates = workoutDates.map(fromDateParam);

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const params = new URLSearchParams({
      date: toDateParam(date),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    startTransition(() => {
      router.push(`/dashboard?${params}`);
    });
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
          modifiers={{ hasWorkout: workoutDayDates }}
          modifiersClassNames={{
            hasWorkout:
              "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-500",
          }}
          className={isPending ? "pointer-events-none opacity-60" : undefined}
        />
      </CardContent>
    </Card>
  );
}
