import type { InsertWorkout, InsertGoal, InsertActivity } from "@shared/schema";

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json() as Promise<AuthResponse>;
    },

    register: async (email: string, password: string, name: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error("Registration failed");
      return res.json() as Promise<AuthResponse>;
    },

    logout: async () => {
      const res = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
      return res.json();
    },

    me: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Not authenticated");
      return res.json() as Promise<AuthResponse>;
    },
  },

  workouts: {
    getAll: async () => {
      const res = await fetch("/api/workouts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return res.json();
    },

    getById: async (id: number) => {
      const res = await fetch(`/api/workouts/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workout");
      return res.json();
    },

    create: async (data: { name: string; date: string; exercises: any[] }) => {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create workout");
      return res.json();
    },
  },

  goals: {
    getAll: async () => {
      const res = await fetch("/api/goals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },

    create: async (data: Omit<InsertGoal, "userId">) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },

    update: async (id: number, current: number) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current }),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    },

    delete: async (id: number) => {
      const res = await fetch(`/api/goals/${id}`, { 
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },
  },

  activities: {
    getAll: async (limit?: number) => {
      const url = limit ? `/api/activities?limit=${limit}` : "/api/activities";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },

    getByDate: async (date: string) => {
      const res = await fetch(`/api/activities/${date}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },

    upsert: async (data: Omit<InsertActivity, "userId">) => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save activity");
      return res.json();
    },
  },
};
