import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, MoreVertical, CheckCircle2, Activity, TrendingUp, Dumbbell, Target, Flame, Footprints, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import goalsImage from '@assets/generated_images/abstract_fitness_goals_achievement_concept.png';

const iconMap: Record<string, any> = {
  Activity,
  TrendingUp,
  Dumbbell,
  Target,
  Flame,
  Footprints,
};

const iconOptions = [
  { value: "Activity", label: "Activity", icon: Activity },
  { value: "TrendingUp", label: "Progress", icon: TrendingUp },
  { value: "Dumbbell", label: "Strength", icon: Dumbbell },
  { value: "Target", label: "Target", icon: Target },
  { value: "Flame", label: "Calories", icon: Flame },
  { value: "Footprints", label: "Steps", icon: Footprints },
];

const colorOptions = [
  { value: "bg-primary", label: "Orange" },
  { value: "bg-secondary", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-pink-500", label: "Pink" },
];

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  current: z.coerce.number().min(0, "Current value must be 0 or more"),
  target: z.coerce.number().min(1, "Target must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  iconName: z.string().min(1, "Please select an icon"),
  color: z.string().min(1, "Please select a color"),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export default function Goals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.goals.getAll(),
  });

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      current: 0,
      target: 100,
      unit: "km",
      iconName: "Target",
      color: "bg-primary",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: GoalFormValues) => api.goals.create({
      title: data.title,
      current: data.current,
      target: data.target,
      unit: data.unit,
      iconName: data.iconName,
      color: data.color,
      inverse: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({
        title: "Goal Created!",
        description: "Your new fitness goal has been added.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => api.goals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({
        title: "Goal Deleted",
        description: "The goal has been removed.",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, current }: { id: number; current: number }) => 
      api.goals.update(id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({
        title: "Progress Updated!",
        description: "Your goal progress has been saved.",
      });
    },
  });

  function onSubmit(data: GoalFormValues) {
    createGoalMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Goals Header Banner */}
      <div className="relative overflow-hidden rounded-2xl h-32 mt-4">
        <img src={goalsImage} alt="Achieve your goals" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6">
          <h1 className="text-2xl font-bold text-white">Your Goals</h1>
          <p className="text-sm text-white/80">Track your fitness milestones and achievements.</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground">Active Goals</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 gap-2"
              data-testid="button-add-goal"
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Run 100 km this month" 
                          data-testid="input-goal-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Progress</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            data-testid="input-goal-current"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            data-testid="input-goal-target"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., km, reps, kg, minutes" 
                          data-testid="input-goal-unit"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iconName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-goal-icon">
                              <SelectValue placeholder="Select icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iconOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-goal-color">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-4 w-4 rounded-full", option.value)} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createGoalMutation.isPending}
                  data-testid="button-create-goal"
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4">
        {goals.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Set Your First Goal</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Challenge yourself with a new fitness target.</p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-create-first-goal"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Goal
            </Button>
          </div>
        ) : (
          goals.map((goal: any) => {
            const IconComponent = iconMap[goal.iconName] || Activity;
            const progressPercent = goal.inverse 
              ? Math.min(100, Math.max(0, ((goal.target / goal.current) * 100)))
              : Math.min(100, Math.max(0, ((goal.current / goal.target) * 100)));
            
            return (
              <Card key={goal.id} className="border-none shadow-sm overflow-hidden" data-testid={`card-goal-${goal.id}`}>
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white shadow-sm", goal.color)}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{goal.title}</h3>
                        <p className="text-xs text-muted-foreground">Target: {goal.target} {goal.unit}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      data-testid={`button-delete-goal-${goal.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20 h-8 text-center"
                          defaultValue={goal.current}
                          onBlur={(e) => {
                            const newValue = parseInt(e.target.value);
                            if (!isNaN(newValue) && newValue !== goal.current) {
                              updateGoalMutation.mutate({ id: goal.id, current: newValue });
                            }
                          }}
                          data-testid={`input-update-goal-${goal.id}`}
                        />
                        <span className="text-muted-foreground">{goal.unit}</span>
                      </div>
                      <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                  
                  {progressPercent >= 100 && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      Goal Achieved!
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {goals.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
          <h3 className="text-lg font-bold text-foreground">Set a New Target</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Challenge yourself with a new fitness goal.</p>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/5"
            onClick={() => setIsDialogOpen(true)}
            data-testid="button-add-another-goal"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Goal
          </Button>
        </div>
      )}
    </div>
  );
}
