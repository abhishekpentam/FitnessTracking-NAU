import { 
  users, workouts, exercises, goals, activities,
  type User, type InsertUser,
  type Workout, type InsertWorkout,
  type Exercise, type InsertExercise,
  type Goal, type InsertGoal,
  type Activity, type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createWorkout(workout: InsertWorkout, exerciseList: InsertExercise[]): Promise<Workout & { exercises: Exercise[] }>;
  getWorkoutsByUserId(userId: number): Promise<(Workout & { exercises: Exercise[] })[]>;
  getWorkoutById(id: number): Promise<(Workout & { exercises: Exercise[] }) | undefined>;
  
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, current: number): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  
  getActivityByUserAndDate(userId: number, date: string): Promise<Activity | undefined>;
  upsertActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUserId(userId: number, limit?: number): Promise<Activity[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createWorkout(workout: InsertWorkout, exerciseList: InsertExercise[]): Promise<Workout & { exercises: Exercise[] }> {
    const [createdWorkout] = await db.insert(workouts).values(workout).returning();
    
    const exercisesWithWorkoutId = exerciseList.map(ex => ({
      ...ex,
      workoutId: createdWorkout.id
    }));
    
    const createdExercises = await db.insert(exercises).values(exercisesWithWorkoutId).returning();
    
    return {
      ...createdWorkout,
      exercises: createdExercises
    };
  }

  async getWorkoutsByUserId(userId: number): Promise<(Workout & { exercises: Exercise[] })[]> {
    const userWorkouts = await db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.date));
    
    const workoutsWithExercises = await Promise.all(
      userWorkouts.map(async (workout) => {
        const workoutExercises = await db.select().from(exercises).where(eq(exercises.workoutId, workout.id));
        return {
          ...workout,
          exercises: workoutExercises
        };
      })
    );
    
    return workoutsWithExercises;
  }

  async getWorkoutById(id: number): Promise<(Workout & { exercises: Exercise[] }) | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    if (!workout) return undefined;
    
    const workoutExercises = await db.select().from(exercises).where(eq(exercises.workoutId, id));
    
    return {
      ...workout,
      exercises: workoutExercises
    };
  }

  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values(goal).returning();
    return created;
  }

  async updateGoal(id: number, current: number): Promise<Goal> {
    const [updated] = await db.update(goals).set({ current }).where(eq(goals.id, id)).returning();
    return updated;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async getActivityByUserAndDate(userId: number, date: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(
      and(eq(activities.userId, userId), eq(activities.date, date))
    );
    return activity || undefined;
  }

  async upsertActivity(activity: InsertActivity): Promise<Activity> {
    const existing = await this.getActivityByUserAndDate(activity.userId, activity.date);
    
    if (existing) {
      const [updated] = await db.update(activities)
        .set(activity)
        .where(eq(activities.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(activities).values(activity).returning();
      return created;
    }
  }

  async getActivitiesByUserId(userId: number, limit: number = 7): Promise<Activity[]> {
    return db.select().from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.date))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
