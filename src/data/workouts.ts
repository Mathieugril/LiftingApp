import "server-only";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { sets, workoutExercises, workouts } from "@/db/schema";

const withDetails = {
  workoutExercises: {
    orderBy: { order: "asc" },
    with: {
      exercise: true,
      sets: { orderBy: { order: "asc" } },
    },
  },
} as const;

export async function getRecentWorkouts(userId: string, limit = 10) {
  return db.query.workouts.findMany({
    where: { userId, performedAt: { isNotNull: true } },
    orderBy: { performedAt: "desc" },
    limit,
    with: withDetails,
  });
}

/** Workouts performed on `date` (`YYYY-MM-DD`), where the day is interpreted in `timeZone`. */
export async function getWorkoutsOnDate(userId: string, date: string, timeZone: string) {
  return db.query.workouts.findMany({
    where: {
      userId,
      performedAt: { isNotNull: true },
      RAW: (t, { sql }) => sql`(${t.performedAt} AT TIME ZONE ${timeZone})::date = ${date}::date`,
    },
    orderBy: { performedAt: "desc" },
    with: withDetails,
  });
}

/** Every date (`YYYY-MM-DD`) with at least one performed workout, with the day interpreted in `timeZone`. */
export async function getWorkoutDates(userId: string, timeZone: string) {
  const rows = await db
    .selectDistinct({
      date: sql<string>`(${workouts.performedAt} AT TIME ZONE ${timeZone})::date`,
    })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), isNotNull(workouts.performedAt)));
  return rows.map((row) => row.date);
}

type NewWorkoutSet = {
  reps: number | null;
  weight: string | null;
  unit: "kg" | "lb";
  rpe: string | null;
  restSeconds: number;
};

type NewWorkoutExercise = {
  exerciseId: string;
  notes: string | null;
  sets: NewWorkoutSet[];
};

type NewWorkout = {
  name: string;
  notes: string | null;
  performedAt: Date;
  exercises: NewWorkoutExercise[];
};

/**
 * Inserts a workout with its exercises and sets. The neon-http driver doesn't support
 * interactive transactions, so this runs as three sequential inserts (workout, then
 * workoutExercises, then sets) rather than one atomic transaction — a failure between
 * steps can leave a partial workout behind.
 */
export async function createWorkout(userId: string, input: NewWorkout) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name,
      notes: input.notes,
      performedAt: input.performedAt,
    })
    .returning();

  const insertedExercises = await db
    .insert(workoutExercises)
    .values(
      input.exercises.map((exercise, index) => ({
        workoutId: workout.id,
        exerciseId: exercise.exerciseId,
        order: index,
        notes: exercise.notes,
      })),
    )
    .returning();

  const setRows = insertedExercises.flatMap((inserted, index) =>
    input.exercises[index].sets.map((set, setIndex) => ({
      workoutExerciseId: inserted.id,
      order: setIndex,
      reps: set.reps,
      weight: set.weight,
      unit: set.unit,
      rpe: set.rpe,
      restSeconds: set.restSeconds,
    })),
  );

  if (setRows.length > 0) {
    await db.insert(sets).values(setRows);
  }

  return workout;
}

export type WorkoutWithDetails = Awaited<ReturnType<typeof getRecentWorkouts>>[number];
