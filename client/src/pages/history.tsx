import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Calendar, Flame, ChevronRight, Trash2, Clock, Weight, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function History() {
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: () => api.workouts.getAll(),
  });

  const groupedWorkouts = workouts.reduce((acc: any, workout: any) => {
    const month = format(new Date(workout.date), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(workout);
    return acc;
  }, {});

  const calculateWorkoutStats = (workout: any) => {
    const totalSets = workout.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0);
    const totalReps = workout.exercises.reduce((sum: number, ex: any) => sum + (ex.sets * ex.reps), 0);
    const totalWeight = workout.exercises.reduce((sum: number, ex: any) => sum + (ex.sets * ex.reps * ex.weight), 0);
    const estimatedCalories = Math.round(totalWeight * 0.05);
    return { totalSets, totalReps, totalWeight, estimatedCalories };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-foreground">Workout History</h1>
        <p className="text-sm text-muted-foreground">View and manage your past workouts.</p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary" data-testid="text-total-workouts">{workouts.length}</p>
            <p className="text-xs text-muted-foreground">Total Workouts</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-secondary" data-testid="text-total-exercises">
              {workouts.reduce((sum: number, w: any) => sum + w.exercises.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500" data-testid="text-this-month">
              {workouts.filter((w: any) => 
                format(new Date(w.date), "MM yyyy") === format(new Date(), "MM yyyy")
              ).length}
            </p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Workout List */}
      {workouts.length === 0 ? (
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-bold text-foreground">No Workouts Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start logging your workouts to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedWorkouts).map(([month, monthWorkouts]: [string, any]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
              {month}
            </h2>
            {monthWorkouts.map((workout: any) => {
              const stats = calculateWorkoutStats(workout);
              return (
                <Card 
                  key={workout.id} 
                  className="border-none shadow-sm cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedWorkout(workout)}
                  data-testid={`card-history-workout-${workout.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{workout.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(workout.date), "EEE, MMM d")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {workout.exercises.length} exercises
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{stats.totalSets}</p>
                        <p className="text-[10px] text-muted-foreground">Sets</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{stats.totalReps}</p>
                        <p className="text-[10px] text-muted-foreground">Reps</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{stats.estimatedCalories}</p>
                        <p className="text-[10px] text-muted-foreground">kcal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      )}

      {/* Workout Detail Modal */}
      <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedWorkout && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  {selectedWorkout.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedWorkout.date), "EEEE, MMMM d, yyyy")}
                </p>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                  Exercises ({selectedWorkout.exercises.length})
                </h3>
                
                {selectedWorkout.exercises.map((exercise: any, index: number) => (
                  <Card key={exercise.id} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-foreground">{exercise.name}</h4>
                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-bold text-sm">{exercise.sets}</p>
                            <p className="text-[10px] text-muted-foreground">Sets</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-bold text-sm">{exercise.reps}</p>
                            <p className="text-[10px] text-muted-foreground">Reps</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-bold text-sm">{exercise.weight}</p>
                            <p className="text-[10px] text-muted-foreground">kg</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Workout Summary */}
                <Card className="border-none bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm mb-3">Workout Summary</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const stats = calculateWorkoutStats(selectedWorkout);
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">~{stats.estimatedCalories} calories burned</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Weight className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{stats.totalWeight.toLocaleString()} kg lifted</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
