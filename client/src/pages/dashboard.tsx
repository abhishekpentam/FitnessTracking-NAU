import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChevronRight, Flame, Trophy, Footprints, Activity as ActivityIcon, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { format, subDays } from "date-fns";
import heroImage from '@assets/generated_images/dynamic_gym_workout_action_shot.png';
import runnerImage from '@assets/generated_images/sunrise_runner_coastal_path_silhouette.png';

export default function Dashboard() {
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => api.activities.getAll(7),
  });

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: () => api.workouts.getAll(),
  });

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.auth.me(),
  });

  const todayActivity = activities.find((a: any) => a.date === format(new Date(), "yyyy-MM-dd")) || {
    steps: 0,
    calories: 0,
    distance: 0,
    activeTime: 0,
  };

  const dailyStats = [
    {
      label: "Steps",
      value: todayActivity.steps.toLocaleString(),
      target: "10,000",
      unit: "steps",
      icon: Footprints,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      progress: Math.min(100, (todayActivity.steps / 10000) * 100)
    },
    {
      label: "Calories",
      value: todayActivity.calories.toLocaleString(),
      target: "2,500",
      unit: "kcal",
      icon: Flame,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
      progress: Math.min(100, (todayActivity.calories / 2500) * 100)
    },
    {
      label: "Distance",
      value: todayActivity.distance.toFixed(1),
      target: "7.0",
      unit: "km",
      icon: ActivityIcon,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      progress: Math.min(100, (todayActivity.distance / 7) * 100)
    },
    {
      label: "Active Time",
      value: todayActivity.activeTime.toString(),
      target: "60",
      unit: "min",
      icon: Timer,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      progress: Math.min(100, (todayActivity.activeTime / 60) * 100)
    }
  ];

  const weeklyActivity = activities
    .slice()
    .reverse()
    .map((a: any) => ({
      day: format(new Date(a.date), "EEE"),
      calories: a.calories,
      steps: a.steps,
    }));

  const recentWorkouts = workouts.slice(0, 3).map((workout: any) => {
    const totalCalories = workout.exercises.reduce((sum: number, ex: any) => 
      sum + (ex.sets * ex.reps * ex.weight * 0.05), 0
    );
    
    return {
      id: workout.id,
      title: workout.name,
      date: format(new Date(workout.date), "MMM d, h:mm a"),
      duration: "45 min",
      calories: Math.round(totalCalories),
      exercises: workout.exercises.length
    };
  });

  if (activitiesLoading || workoutsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-username">
            {user?.user?.name || "User"}
          </h1>
        </div>
        <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.user?.name || "User"}`} 
            alt="User Avatar" 
            className="h-full w-full object-cover"
          />
        </div>
      </header>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <div className="absolute inset-0 z-0 opacity-30">
           <img src={heroImage} alt="Background" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium w-fit backdrop-blur-sm">
            <Trophy className="h-3 w-3" />
            <span>Daily Progress</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tighter" data-testid="text-steps">{todayActivity.steps.toLocaleString()}</h2>
            <p className="text-sm font-medium opacity-90">Steps today</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
            <div 
              className="h-full bg-white/90 transition-all" 
              style={{ width: `${Math.min(100, (todayActivity.steps / 10000) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {dailyStats.map((stat, i) => (
          <Card key={i} className="border-none bg-card shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-xs text-muted-foreground ml-1">{stat.unit}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Chart */}
      {weeklyActivity.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivity}>
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(16 100% 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(16 100% 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(215 16% 47%)' }}
                    dy={10}
                  />
                  <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: 'hsl(214 32% 91%)', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="hsl(16 100% 60%)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCalories)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivation Banner */}
      <div className="relative overflow-hidden rounded-2xl h-32">
        <img src={runnerImage} alt="Stay motivated" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary/40" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Daily Motivation</p>
          <p className="text-white text-lg font-bold">Keep pushing your limits!</p>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent Workouts</h3>
        </div>
        {recentWorkouts.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No workouts yet. Start logging your first workout!</p>
            </CardContent>
          </Card>
        ) : (
          recentWorkouts.map((workout: any) => (
            <div 
              key={workout.id}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
              data-testid={`card-workout-${workout.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{workout.title}</h4>
                  <p className="text-xs text-muted-foreground">{workout.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{workout.calories} kcal</p>
                      <p className="text-xs text-muted-foreground">{workout.exercises} exercises</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
