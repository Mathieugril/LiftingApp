"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Exercise } from "@/data/exercises";
import type { ExerciseFieldsState, SetFieldsState } from "./new-workout-form";

function emptySet(): SetFieldsState {
  return {
    key: crypto.randomUUID(),
    reps: "",
    weight: "",
    unit: "kg",
    rpe: "",
    restSeconds: "90",
  };
}

export { emptySet };

export function ExerciseFields({
  index,
  exercise,
  exercises,
  disabled,
  onChange,
  onRemove,
}: {
  index: number;
  exercise: ExerciseFieldsState;
  exercises: Exercise[];
  disabled: boolean;
  onChange: (next: ExerciseFieldsState) => void;
  onRemove: () => void;
}) {
  function updateSet(setIndex: number, patch: Partial<SetFieldsState>) {
    onChange({
      ...exercise,
      sets: exercise.sets.map((set, i) => (i === setIndex ? { ...set, ...patch } : set)),
    });
  }

  function addSet() {
    onChange({ ...exercise, sets: [...exercise.sets, emptySet()] });
  }

  function removeSet(setIndex: number) {
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== setIndex) });
  }

  return (
    <Card size="sm">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={`exercise-${exercise.key}`}>Exercise {index + 1}</Label>
          <Select
            value={exercise.exerciseId}
            onValueChange={(value) => value && onChange({ ...exercise, exerciseId: value })}
            disabled={disabled}
          >
            <SelectTrigger id={`exercise-${exercise.key}`} className="w-full">
              <SelectValue placeholder="Select an exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove exercise"
        >
          <XIcon />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`exercise-notes-${exercise.key}`}>Notes</Label>
          <Input
            id={`exercise-notes-${exercise.key}`}
            value={exercise.notes}
            onChange={(event) => onChange({ ...exercise, notes: event.target.value })}
            placeholder="Optional"
            maxLength={500}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-2">
          {exercise.sets.map((set, setIndex) => (
            <div
              key={set.key}
              className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Reps</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={set.reps}
                  onChange={(event) => updateSet(setIndex, { reps: event.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={set.weight}
                  onChange={(event) => updateSet(setIndex, { weight: event.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Select
                  value={set.unit}
                  onValueChange={(value) => updateSet(setIndex, { unit: value as "kg" | "lb" })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">RPE</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={10}
                  step="any"
                  value={set.rpe}
                  onChange={(event) => updateSet(setIndex, { rpe: event.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Rest (s)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={set.restSeconds}
                  onChange={(event) => updateSet(setIndex, { restSeconds: event.target.value })}
                  disabled={disabled}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSet(setIndex)}
                disabled={disabled || exercise.sets.length === 1}
                aria-label="Remove set"
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSet}
          disabled={disabled}
          className="self-start"
        >
          <PlusIcon data-icon="inline-start" />
          Add set
        </Button>
      </CardContent>
    </Card>
  );
}
