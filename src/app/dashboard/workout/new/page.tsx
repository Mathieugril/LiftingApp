import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExercises } from "@/data/exercises";
import { NewWorkoutForm } from "./_components/new-workout-form";

export default async function NewWorkoutPage() {
  await auth.protect();
  const exercises = await getExercises();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">New workout</h1>
        <p className="text-sm text-muted-foreground">Log a new training session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewWorkoutForm exercises={exercises} />
        </CardContent>
      </Card>
    </main>
  );
}
