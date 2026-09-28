"use client";

import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkoutWithDetails } from "@/db/queries/workouts";
import { WorkoutDetails } from "./workout-details";

function workoutName(workout: WorkoutWithDetails) {
  return workout.name ?? "Untitled workout";
}

function WorkoutDate({ date }: { date: Date }) {
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {date.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </time>
  );
}

export function WorkoutList({ workouts }: { workouts: WorkoutWithDetails[] }) {
  const [selected, setSelected] = useState<WorkoutWithDetails | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <ul className="flex flex-col divide-y overflow-hidden rounded-xl border">
        {workouts.map((workout) => {
          const exerciseCount = workout.workoutExercises.length;
          return (
            <li key={workout.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelected(workout);
                  setOpen(true);
                }}
                className="h-auto w-full justify-between gap-4 rounded-none px-4 py-4 text-left"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-base font-medium">{workoutName(workout)}</span>
                  <span className="text-sm text-muted-foreground">
                    {workout.performedAt && <WorkoutDate date={workout.performedAt} />}
                    {" · "}
                    {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
                  </span>
                </div>
                <ChevronRightIcon data-icon="inline-end" className="text-muted-foreground" />
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        {selected && (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{workoutName(selected)}</DialogTitle>
              {selected.performedAt && (
                <DialogDescription>
                  <WorkoutDate date={selected.performedAt} />
                </DialogDescription>
              )}
            </DialogHeader>
            <WorkoutDetails workout={selected} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
