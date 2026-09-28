import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { DumbbellIcon } from "lucide-react";
import { getRecentWorkouts, getWorkoutsOnDate } from "@/db/queries/workouts";
import { fromDateParam, parseDateParam, parseTimeZone } from "@/lib/dates";
import { DatePicker } from "./_components/date-picker";
import { WorkoutList } from "./_components/workout-list";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { userId } = await auth.protect();
  const params = await searchParams;
  const date = parseDateParam(params.date);

  const workouts = date
    ? await getWorkoutsOnDate(userId, date, parseTimeZone(params.tz))
    : await getRecentWorkouts(userId);

  const heading = date
    ? `Workouts on ${fromDateParam(date).toLocaleDateString("en-US", { dateStyle: "long" })}`
    : "Recent workouts";
  const subheading = date
    ? "Everything you logged on this day."
    : "Track your training history.";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">{subheading}</p>
          {date && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Back to recent workouts
            </Link>
          )}
        </div>
        <DatePicker selected={date} />
      </div>

      {workouts.length > 0 ? (
        <WorkoutList workouts={workouts} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-8 py-12 text-center">
          <DumbbellIcon className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {date ? "No workouts logged on this date." : "No workouts logged yet."}
          </p>
        </div>
      )}
    </main>
  );
}
