"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const setSchema = z.object({
  reps: z.number().int().min(0).max(1000).nullable(),
  weight: z.number().min(0).max(2000).nullable(),
  unit: z.enum(["kg", "lb"]),
  rpe: z.number().min(0).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(3600),
});

const workoutExerciseSchema = z.object({
  exerciseId: z.uuid(),
  notes: z.string().trim().max(500).nullable(),
  sets: z.array(setSchema).min(1, "Add at least one set"),
});

const createWorkoutSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  notes: z.string().trim().max(2000).nullable(),
  performedAt: z.iso.datetime(),
  exercises: z.array(workoutExerciseSchema).min(1, "Add at least one exercise"),
});

export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  const { userId } = await auth.protect();
  const parsed = createWorkoutSchema.parse(input);

  const workout = await createWorkout(userId, {
    name: parsed.name,
    notes: parsed.notes,
    performedAt: new Date(parsed.performedAt),
    exercises: parsed.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight === null ? null : String(set.weight),
        unit: set.unit,
        rpe: set.rpe === null ? null : String(set.rpe),
        restSeconds: set.restSeconds,
      })),
    })),
  });

  return { id: workout.id };
}
