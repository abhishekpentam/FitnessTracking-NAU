import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Dumbbell, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import equipmentImage from '@assets/generated_images/aesthetic_gym_equipment_arrangement.png';

const workoutSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  date: z.date(),
  exercises: z.array(z.object({
    name: z.string().min(1, "Exercise name required"),
    sets: z.coerce.number().min(1),
    reps: z.coerce.number().min(1),
    weight: z.coerce.number().min(0),
  })).min(1, "Add at least one exercise")
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

export default function WorkoutLog() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      exercises: [{ name: "", sets: 3, reps: 10, weight: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises"
  });

  const createWorkoutMutation = useMutation({
    mutationFn: (data: WorkoutFormValues) => api.workouts.create({
      name: data.name,
      date: format(data.date, "yyyy-MM-dd"),
      exercises: data.exercises,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast({
        title: "Workout Logged!",
        description: "Successfully saved your workout.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: WorkoutFormValues) {
    createWorkoutMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="pt-4">
        <div className="relative overflow-hidden rounded-2xl h-28 mb-4">
          <img src={equipmentImage} alt="Gym equipment" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40" />
          <div className="relative z-10 h-full flex flex-col justify-center px-6">
            <h1 className="text-2xl font-bold text-white">Log Workout</h1>
            <p className="text-sm text-white/80">Record your latest session details.</p>
          </div>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          
          {/* Basic Info */}
          <Card className="border-none shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Leg Day, Morning Run" 
                        className="bg-muted/50 border-0"
                        data-testid="input-workout-name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-muted/50 border-0",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-date-picker"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Exercises */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Exercises</h2>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ name: "", sets: 3, reps: 10, weight: 0 })}
                    className="h-8 gap-2 text-primary hover:text-primary border-primary/20 hover:bg-primary/10"
                    data-testid="button-add-exercise"
                >
                    <Plus className="h-4 w-4" /> Add Exercise
                </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="overflow-hidden border-none shadow-sm animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <div className="absolute right-0 top-0 p-2">
                    {fields.length > 1 && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-exercise-${index}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <CardContent className="p-4 pt-8 flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Exercise Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Dumbbell className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="e.g., Bench Press" 
                              className="pl-9 bg-muted/30"
                              data-testid={`input-exercise-name-${index}`} 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.sets`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Sets</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              className="bg-muted/30 text-center"
                              data-testid={`input-sets-${index}`} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.reps`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Reps</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              className="bg-muted/30 text-center"
                              data-testid={`input-reps-${index}`} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Kg</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.5" 
                              className="bg-muted/30 text-center"
                              data-testid={`input-weight-${index}`} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 mt-4"
            disabled={createWorkoutMutation.isPending}
            data-testid="button-save-workout"
          >
            <Save className="mr-2 h-5 w-5" /> {createWorkoutMutation.isPending ? "Saving..." : "Save Workout"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
