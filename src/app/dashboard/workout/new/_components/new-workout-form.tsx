"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Exercise } from "@/data/exercises";
import { createWorkoutAction } from "../actions";
import { emptySet, ExerciseFields } from "./exercise-fields";

export type SetFieldsState = {
  key: string;
  reps: string;
  weight: string;
  unit: "kg" | "lb";
  rpe: string;
  restSeconds: string;
};

export type ExerciseFieldsState = {
  key: string;
  exerciseId: string;
  notes: string;
  sets: SetFieldsState[];
};

function emptyExercise(defaultExerciseId: string): ExerciseFieldsState {
  return {
    key: crypto.randomUUID(),
    exerciseId: defaultExerciseId,
    notes: "",
    sets: [emptySet()],
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNumber(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function NewWorkoutForm({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [performedAt, setPerformedAt] = useState<Date>(new Date());
  const [exerciseFields, setExerciseFields] = useState<ExerciseFieldsState[]>(() =>
    exercises.length > 0 ? [emptyExercise(exercises[0].id)] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addExercise() {
    if (exercises.length === 0) return;
    setExerciseFields((current) => [...current, emptyExercise(exercises[0].id)]);
  }

  function updateExercise(index: number, next: ExerciseFieldsState) {
    setExerciseFields((current) => current.map((exercise, i) => (i === index ? next : exercise)));
  }

  function removeExercise(index: number) {
    setExerciseFields((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (exerciseFields.length === 0) {
      setError("Add at least one exercise.");
      return;
    }

    startTransition(async () => {
      try {
        await createWorkoutAction({
          name,
          notes: notes.trim() === "" ? null : notes,
          performedAt: performedAt.toISOString(),
          exercises: exerciseFields.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            notes: exercise.notes.trim() === "" ? null : exercise.notes,
            sets: exercise.sets.map((set) => ({
              reps: parseOptionalNumber(set.reps),
              weight: parseOptionalNumber(set.weight),
              unit: set.unit,
              rpe: parseOptionalNumber(set.rpe),
              restSeconds: parseNumber(set.restSeconds, 90),
            })),
          })),
        });
        router.push("/dashboard");
      } catch {
        setError("Couldn't create the workout. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Push day"
          maxLength={120}
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Date</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                id="date"
                type="button"
                variant="outline"
                className="w-fit justify-start"
                disabled={isPending}
              />
            }
          >
            <CalendarIcon data-icon="inline-start" />
            {performedAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={performedAt}
              defaultMonth={performedAt}
              onSelect={(date) => date && setPerformedAt(date)}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes about this workout"
          maxLength={2000}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Label>Exercises</Label>

        {exerciseFields.length === 0 && exercises.length > 0 && (
          <p className="text-sm text-muted-foreground">No exercises added yet.</p>
        )}

        {exercises.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No exercises exist in the catalog yet, so none can be added to a workout.
          </p>
        )}

        {exerciseFields.map((exercise, index) => (
          <ExerciseFields
            key={exercise.key}
            index={index}
            exercise={exercise}
            exercises={exercises}
            disabled={isPending}
            onChange={(next) => updateExercise(index, next)}
            onRemove={() => removeExercise(index)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addExercise}
          disabled={isPending || exercises.length === 0}
          className="self-start"
        >
          <PlusIcon data-icon="inline-start" />
          Add exercise
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending || exercises.length === 0}>
        {isPending ? "Creating…" : "Create workout"}
      </Button>
    </form>
  );
}
