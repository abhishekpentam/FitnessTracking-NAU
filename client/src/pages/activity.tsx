import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Footprints, Flame, Activity as ActivityIcon, Timer, Save, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const activitySchema = z.object({
  steps: z.coerce.number().min(0, "Steps must be 0 or more"),
  calories: z.coerce.number().min(0, "Calories must be 0 or more"),
  distance: z.coerce.number().min(0, "Distance must be 0 or more"),
  activeTime: z.coerce.number().min(0, "Active time must be 0 or more"),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export default function Activity() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => api.activities.getAll(30),
  });

  const currentActivity = activities.find((a: any) => a.date === dateString);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      steps: 0,
      calories: 0,
      distance: 0,
      activeTime: 0,
    },
  });

  // Track if we've synced the form for the current date
  const lastSyncedDate = useRef<string>("");
  
  // Sync form with current date's activity when data loads or date changes
  useEffect(() => {
    if (!isLoading && dateString !== lastSyncedDate.current) {
      lastSyncedDate.current = dateString;
      const activity = activities.find((a: any) => a.date === dateString);
      form.reset({
        steps: activity?.steps || 0,
        calories: activity?.calories || 0,
        distance: activity?.distance || 0,
        activeTime: activity?.activeTime || 0,
      });
    }
  }, [dateString, isLoading]);

  const saveActivityMutation = useMutation({
    mutationFn: (data: ActivityFormValues) => api.activities.upsert({
      date: dateString,
      steps: data.steps,
      calories: data.calories,
      distance: data.distance,
      activeTime: data.activeTime,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({
        title: "Activity Saved!",
        description: `Your activity for ${format(selectedDate, "MMM d, yyyy")} has been recorded.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ActivityFormValues) {
    saveActivityMutation.mutate(data);
  }

  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    const newDateString = format(newDate, "yyyy-MM-dd");
    const activity = activities.find((a: any) => a.date === newDateString);
    form.reset({
      steps: activity?.steps || 0,
      calories: activity?.calories || 0,
      distance: activity?.distance || 0,
      activeTime: activity?.activeTime || 0,
    });
  };
  
  const goToNextDay = () => {
    if (selectedDate < new Date()) {
      const newDate = addDays(selectedDate, 1);
      setSelectedDate(newDate);
      const newDateString = format(newDate, "yyyy-MM-dd");
      const activity = activities.find((a: any) => a.date === newDateString);
      form.reset({
        steps: activity?.steps || 0,
        calories: activity?.calories || 0,
        distance: activity?.distance || 0,
        activeTime: activity?.activeTime || 0,
      });
    }
  };
  
  const goToToday = () => {
    const newDate = new Date();
    setSelectedDate(newDate);
    const newDateString = format(newDate, "yyyy-MM-dd");
    const activity = activities.find((a: any) => a.date === newDateString);
    form.reset({
      steps: activity?.steps || 0,
      calories: activity?.calories || 0,
      distance: activity?.distance || 0,
      activeTime: activity?.activeTime || 0,
    });
  };

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const stats = [
    { key: "steps", label: "Steps", icon: Footprints, color: "text-blue-500", bg: "bg-blue-500/10", unit: "" },
    { key: "calories", label: "Calories", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", unit: "kcal" },
    { key: "distance", label: "Distance", icon: ActivityIcon, color: "text-green-500", bg: "bg-green-500/10", unit: "km" },
    { key: "activeTime", label: "Active Time", icon: Timer, color: "text-purple-500", bg: "bg-purple-500/10", unit: "min" },
  ];

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
        <h1 className="text-2xl font-bold text-foreground">Daily Activity</h1>
        <p className="text-sm text-muted-foreground">Track your daily steps, calories, and more.</p>
      </header>

      {/* Date Selector */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPreviousDay}
              data-testid="button-prev-day"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-lg" data-testid="text-selected-date">
                  {format(selectedDate, "EEEE, MMM d")}
                </span>
              </div>
              {!isToday && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary h-auto p-0"
                  onClick={goToToday}
                  data-testid="button-go-to-today"
                >
                  Go to Today
                </Button>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextDay}
              disabled={isToday}
              data-testid="button-next-day"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <FormField
                key={stat.key}
                control={form.control}
                name={stat.key as keyof ActivityFormValues}
                render={({ field }) => (
                  <FormItem>
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", stat.bg)}>
                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                          </div>
                          <FormLabel className="text-sm font-medium">{stat.label}</FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              step={stat.key === "distance" ? "0.1" : "1"}
                              className="text-2xl font-bold h-14 pr-12"
                              data-testid={`input-${stat.key}`}
                              {...field} 
                            />
                            {stat.unit && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {stat.unit}
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
            disabled={saveActivityMutation.isPending}
            data-testid="button-save-activity"
          >
            <Save className="mr-2 h-5 w-5" /> 
            {saveActivityMutation.isPending ? "Saving..." : "Save Activity"}
          </Button>
        </form>
      </Form>

      {/* Quick Stats */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-secondary/10 to-secondary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Quick Add</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => form.setValue("steps", form.getValues("steps") + 1000)}
            data-testid="button-add-1000-steps"
          >
            +1,000 Steps
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => form.setValue("calories", form.getValues("calories") + 100)}
            data-testid="button-add-100-calories"
          >
            +100 Calories
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => form.setValue("activeTime", form.getValues("activeTime") + 15)}
            data-testid="button-add-15-minutes"
          >
            +15 Minutes
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => form.setValue("distance", form.getValues("distance") + 1)}
            data-testid="button-add-1-km"
          >
            +1 km
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
