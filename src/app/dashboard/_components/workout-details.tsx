import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkoutWithDetails } from "@/data/workouts";

type WorkoutSet = WorkoutWithDetails["workoutExercises"][number]["sets"][number];

function formatWeight(set: WorkoutSet) {
  if (set.weight === null) return set.reps === null ? "—" : "BW";
  return `${Number(set.weight)} ${set.unit}`;
}

function formatRest(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

export function WorkoutDetails({ workout }: { workout: WorkoutWithDetails }) {
  return (
    <div className="flex flex-col gap-4">
      {workout.notes && <p className="text-muted-foreground">{workout.notes}</p>}

      {workout.workoutExercises.length === 0 && (
        <p className="text-muted-foreground">No exercises logged.</p>
      )}

      {workout.workoutExercises.map((workoutExercise) => (
        <section key={workoutExercise.id} className="flex flex-col gap-2">
          <div>
            <h3 className="font-medium">{workoutExercise.exercise?.name ?? "Unknown exercise"}</h3>
            {workoutExercise.notes && (
              <p className="text-xs text-muted-foreground">{workoutExercise.notes}</p>
            )}
          </div>

          {workoutExercise.sets.length > 0 && (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-auto py-1 text-xs">Set</TableHead>
                  <TableHead className="h-auto py-1 text-xs">Reps</TableHead>
                  <TableHead className="h-auto py-1 text-xs">Weight</TableHead>
                  <TableHead className="h-auto py-1 text-xs">RPE</TableHead>
                  <TableHead className="h-auto py-1 text-xs">Rest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workoutExercise.sets.map((set, index) => (
                  <TableRow key={set.id}>
                    <TableCell className="py-1">{index + 1}</TableCell>
                    <TableCell className="py-1">{set.reps ?? "—"}</TableCell>
                    <TableCell className="py-1">{formatWeight(set)}</TableCell>
                    <TableCell className="py-1">
                      {set.rpe === null ? "—" : Number(set.rpe)}
                    </TableCell>
                    <TableCell className="py-1">{formatRest(set.restSeconds)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      ))}
    </div>
  );
}
