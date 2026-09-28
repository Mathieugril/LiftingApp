import "server-only";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

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

export type WorkoutWithDetails = Awaited<ReturnType<typeof getRecentWorkouts>>[number];
