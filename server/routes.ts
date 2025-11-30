import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { User as DbUser, InsertUser, InsertWorkout, InsertExercise, InsertGoal, InsertActivity } from "@shared/schema";
import { insertUserSchema, insertWorkoutSchema, insertExerciseSchema, insertGoalSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session configuration
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fitness-tracker-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: true,
        sameSite: "none",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || user.password !== password) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user as any);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const user = await storage.createUser({ email, password, name });
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to login after registration" });
        }
        return res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: DbUser, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user as any, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user!;
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  // Workout routes
  app.post("/api/workouts", requireAuth, async (req, res) => {
    try {
      const { name, date, exercises: exerciseList } = req.body;
      
      const workoutData = insertWorkoutSchema.parse({
        userId: req.user!.id,
        name,
        date,
      });

      const exercisesData = z.array(insertExerciseSchema.omit({ workoutId: true })).parse(exerciseList);
      
      const workout = await storage.createWorkout(workoutData, exercisesData as InsertExercise[]);
      
      res.json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create workout" });
    }
  });

  app.get("/api/workouts", requireAuth, async (req, res) => {
    try {
      const workouts = await storage.getWorkoutsByUserId(req.user!.id);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  app.get("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkoutById(id);
      
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      
      if (workout.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout" });
    }
  });

  // Goals routes
  app.get("/api/goals", requireAuth, async (req, res) => {
    try {
      const goals = await storage.getGoalsByUserId(req.user!.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", requireAuth, async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const goal = await storage.createGoal(goalData);
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { current } = req.body;
      
      if (typeof current !== "number") {
        return res.status(400).json({ error: "Invalid current value" });
      }
      
      const goal = await storage.updateGoal(id, current);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGoal(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Activity routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 7;
      const activities = await storage.getActivitiesByUserId(req.user!.id, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/:date", requireAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const activity = await storage.getActivityByUserAndDate(req.user!.id, date);
      res.json(activity || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.post("/api/activities", requireAuth, async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const activity = await storage.upsertActivity(activityData);
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save activity" });
    }
  });

  return httpServer;
}
