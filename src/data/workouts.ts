import "server-only";
import { db } from "@/db";

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

export type WorkoutWithDetails = Awaited<ReturnType<typeof getRecentWorkouts>>[number];
