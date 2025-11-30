import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Minus, Flame, Footprints, Dumbbell, Target, Calendar, Award } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => api.activities.getAll(60),
  });

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: () => api.workouts.getAll(),
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.goals.getAll(),
  });

  const isLoading = activitiesLoading || workoutsLoading || goalsLoading;

  const now = new Date();
  const periodStart = period === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const periodEnd = period === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
  const previousPeriodStart = period === "week" ? subDays(periodStart, 7) : subDays(periodStart, 30);
  const previousPeriodEnd = period === "week" ? subDays(periodStart, 1) : subDays(periodStart, 1);

  const currentActivities = activities.filter((a: any) => 
    isWithinInterval(new Date(a.date), { start: periodStart, end: periodEnd })
  );

  const previousActivities = activities.filter((a: any) => 
    isWithinInterval(new Date(a.date), { start: previousPeriodStart, end: previousPeriodEnd })
  );

  const currentWorkouts = workouts.filter((w: any) => 
    isWithinInterval(new Date(w.date), { start: periodStart, end: periodEnd })
  );

  const previousWorkouts = workouts.filter((w: any) => 
    isWithinInterval(new Date(w.date), { start: previousPeriodStart, end: previousPeriodEnd })
  );

  const sumField = (arr: any[], field: string) => arr.reduce((sum, item) => sum + (item[field] || 0), 0);
  const avgField = (arr: any[], field: string) => arr.length ? Math.round(sumField(arr, field) / arr.length) : 0;

  const stats = {
    steps: { current: sumField(currentActivities, "steps"), previous: sumField(previousActivities, "steps") },
    calories: { current: sumField(currentActivities, "calories"), previous: sumField(previousActivities, "calories") },
    distance: { current: sumField(currentActivities, "distance"), previous: sumField(previousActivities, "distance") },
    workouts: { current: currentWorkouts.length, previous: previousWorkouts.length },
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getTrend = (change: number) => {
    if (change > 0) return { icon: TrendingUp, color: "text-green-500", label: `+${change}%` };
    if (change < 0) return { icon: TrendingDown, color: "text-red-500", label: `${change}%` };
    return { icon: Minus, color: "text-muted-foreground", label: "0%" };
  };

  const daysInPeriod = eachDayOfInterval({ start: periodStart, end: periodEnd });
  const chartData = daysInPeriod.map(day => {
    const dateStr = format(day, "yyyy-MM-dd");
    const activity = activities.find((a: any) => a.date === dateStr);
    return {
      date: format(day, period === "week" ? "EEE" : "d"),
      fullDate: format(day, "MMM d"),
      steps: activity?.steps || 0,
      calories: activity?.calories || 0,
      distance: activity?.distance || 0,
    };
  });

  const goalsProgress = goals.map((goal: any) => {
    let percent = 0;
    if (goal.inverse) {
      // For inverse goals (like weight loss), progress = how close current is to target
      // target/current gives progress ratio (e.g., 70kg target / 80kg current = 87.5%)
      // When current <= target, goal is achieved (100%)
      if (goal.current <= goal.target) {
        percent = 100;
      } else if (goal.current > 0) {
        percent = Math.min(100, Math.max(0, (goal.target / goal.current) * 100));
      }
    } else {
      // Normal goals - progress increases as current increases toward target
      percent = goal.target > 0 ? Math.min(100, Math.max(0, (goal.current / goal.target) * 100)) : 0;
    }
    return { ...goal, percent };
  });

  const completedGoals = goalsProgress.filter((g: any) => g.percent >= 100).length;

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
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Your fitness summary and insights.</p>
      </header>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="week" data-testid="tab-weekly">This Week</TabsTrigger>
          <TabsTrigger value="month" data-testid="tab-monthly">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "steps", label: "Steps", icon: Footprints, color: "text-blue-500", bg: "bg-blue-500/10", format: (v: number) => v.toLocaleString() },
              { key: "calories", label: "Calories", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", format: (v: number) => `${v.toLocaleString()} kcal` },
              { key: "distance", label: "Distance", icon: Target, color: "text-green-500", bg: "bg-green-500/10", format: (v: number) => `${v.toFixed(1)} km` },
              { key: "workouts", label: "Workouts", icon: Dumbbell, color: "text-purple-500", bg: "bg-purple-500/10", format: (v: number) => v.toString() },
            ].map((metric) => {
              const stat = stats[metric.key as keyof typeof stats];
              const change = getChange(stat.current, stat.previous);
              const trend = getTrend(change);
              
              return (
                <Card key={metric.key} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", metric.bg)}>
                        <metric.icon className={cn("h-4 w-4", metric.color)} />
                      </div>
                    </div>
                    <p className="text-xl font-bold" data-testid={`text-${metric.key}-value`}>
                      {metric.format(stat.current)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <trend.icon className={cn("h-3 w-3", trend.color)} />
                      <span className={cn("text-xs font-medium", trend.color)}>{trend.label}</span>
                      <span className="text-xs text-muted-foreground">vs last {period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Activity Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: 'hsl(var(--card))'
                      }}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="steps" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#colorSteps)"
                      name="Steps"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Calories Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Calories Burned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: 'hsl(var(--card))'
                      }}
                      formatter={(value: number) => [`${value} kcal`, 'Calories']}
                    />
                    <Bar 
                      dataKey="calories" 
                      fill="hsl(16 100% 60%)" 
                      radius={[4, 4, 0, 0]}
                      name="Calories"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Goals Progress */}
          {goalsProgress.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    Goals Progress
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completedGoals}/{goalsProgress.length} completed
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goalsProgress.map((goal: any) => (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-muted-foreground">
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            goal.percent >= 100 ? "bg-green-500" : goal.color || "bg-primary"
                          )}
                          style={{ width: `${Math.min(100, goal.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                {period === "week" ? "Weekly" : "Monthly"} Highlights
              </h3>
              <div className="space-y-2">
                {stats.steps.current > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Footprints className="h-4 w-4 text-blue-500" />
                    <span>Walked {(stats.steps.current / 1000).toFixed(1)}k steps this {period}</span>
                  </div>
                )}
                {stats.calories.current > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>Burned {stats.calories.current.toLocaleString()} calories</span>
                  </div>
                )}
                {stats.workouts.current > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Dumbbell className="h-4 w-4 text-purple-500" />
                    <span>Completed {stats.workouts.current} workout{stats.workouts.current > 1 ? 's' : ''}</span>
                  </div>
                )}
                {completedGoals > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Achieved {completedGoals} goal{completedGoals > 1 ? 's' : ''}!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
