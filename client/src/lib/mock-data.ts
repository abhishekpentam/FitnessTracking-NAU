import { 
  Activity, 
  Flame, 
  Footprints, 
  Timer,
  Dumbbell,
  TrendingUp
} from "lucide-react";

export const dailyStats = [
  {
    label: "Steps",
    value: "8,432",
    target: "10,000",
    unit: "steps",
    icon: Footprints,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    progress: 84
  },
  {
    label: "Calories",
    value: "1,840",
    target: "2,500",
    unit: "kcal",
    icon: Flame,
    color: "text-chart-1",
    bg: "bg-chart-1/10",
    progress: 73
  },
  {
    label: "Distance",
    value: "5.2",
    target: "7.0",
    unit: "km",
    icon: Activity,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    progress: 74
  },
  {
    label: "Active Time",
    value: "45",
    target: "60",
    unit: "min",
    icon: Timer,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    progress: 75
  }
];

export const weeklyActivity = [
  { day: "Mon", calories: 2100, steps: 9500 },
  { day: "Tue", calories: 1800, steps: 7200 },
  { day: "Wed", calories: 2400, steps: 11000 },
  { day: "Thu", calories: 1950, steps: 8100 },
  { day: "Fri", calories: 2200, steps: 10500 },
  { day: "Sat", calories: 2600, steps: 12500 },
  { day: "Sun", calories: 1840, steps: 8432 }
];

export const recentWorkouts = [
  {
    id: 1,
    title: "Upper Body Power",
    date: "Today, 9:00 AM",
    duration: "45 min",
    calories: 320,
    exercises: 6
  },
  {
    id: 2,
    title: "Morning Run",
    date: "Yesterday, 7:30 AM",
    duration: "30 min",
    calories: 280,
    exercises: 1
  },
  {
    id: 3,
    title: "Full Body HIIT",
    date: "Oct 24, 6:00 PM",
    duration: "50 min",
    calories: 450,
    exercises: 8
  }
];

export const initialGoals = [
  {
    id: 1,
    title: "Weekly Running Distance",
    current: 15.5,
    target: 20,
    unit: "km",
    icon: Activity,
    color: "bg-chart-2"
  },
  {
    id: 2,
    title: "Weight Loss",
    current: 78.5,
    target: 75,
    unit: "kg",
    inverse: true, // Lower is better
    icon: TrendingUp,
    color: "bg-chart-1"
  },
  {
    id: 3,
    title: "Bench Press Max",
    current: 85,
    target: 100,
    unit: "kg",
    icon: Dumbbell,
    color: "bg-chart-3"
  }
];
