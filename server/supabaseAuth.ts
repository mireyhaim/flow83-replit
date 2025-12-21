import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateUserDataByEmail(newUserId: string, email: string): Promise<void> {
  try {
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser && existingUser.id !== newUserId) {
      console.log(`Migrating data from old user ${existingUser.id} to new user ${newUserId}`);
      await storage.migrateUserData(existingUser.id, newUserId);
      console.log(`Migration complete for user ${email}`);
    }
  } catch (error) {
    console.error("Error migrating user data:", error);
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email || email,
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: null,
        });

        (req.session as any).userId = data.user.id;
        (req.session as any).accessToken = data.session?.access_token;
        (req.session as any).refreshToken = data.session?.refresh_token;
      }

      res.status(201).json({
        message: "User created successfully",
        user: data.user,
        session: data.session,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      if (data.user) {
        await migrateUserDataByEmail(data.user.id, data.user.email || email);
        
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email || email,
          firstName: data.user.user_metadata?.first_name || null,
          lastName: data.user.user_metadata?.last_name || null,
          profileImageUrl: data.user.user_metadata?.avatar_url || null,
        });

        (req.session as any).userId = data.user.id;
        (req.session as any).accessToken = data.session?.access_token;
        (req.session as any).refreshToken = data.session?.refresh_token;
      }

      res.json({
        message: "Signed in successfully",
        user: data.user,
        session: data.session,
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    try {
      const accessToken = (req.session as any)?.accessToken;
      
      if (accessToken) {
        await supabase.auth.signOut();
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Signed out successfully" });
      });
    } catch (error) {
      console.error("Signout error:", error);
      res.status(500).json({ error: "Failed to sign out" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const accessToken = (req.session as any)?.accessToken;
      const userId = (req.session as any)?.userId;

      if (!accessToken || !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error) {
        const refreshToken = (req.session as any)?.refreshToken;
        if (refreshToken) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
          });

          if (refreshError || !refreshData.session) {
            return res.status(401).json({ message: "Session expired" });
          }

          (req.session as any).accessToken = refreshData.session.access_token;
          (req.session as any).refreshToken = refreshData.session.refresh_token;

          const user = await storage.getUser(userId);
          return res.json(user);
        }
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = (req.session as any)?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token" });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      if (data.session) {
        (req.session as any).accessToken = data.session.access_token;
        (req.session as any).refreshToken = data.session.refresh_token;
      }

      res.json({ session: data.session });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ error: "Failed to refresh session" });
    }
  });

  app.get("/api/login", (req, res) => {
    res.redirect("/login");
  });

  app.get("/api/logout", async (req, res) => {
    try {
      await supabase.auth.signOut();
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.redirect("/");
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const accessToken = (req.session as any)?.accessToken;
  const userId = (req.session as any)?.userId;

  if (!accessToken || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      const refreshToken = (req.session as any)?.refreshToken;
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (!refreshError && refreshData.session && refreshData.user) {
          (req.session as any).accessToken = refreshData.session.access_token;
          (req.session as any).refreshToken = refreshData.session.refresh_token;
          (req as any).userId = refreshData.user.id;
          
          return req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ message: "Session error" });
            }
            next();
          });
        }
      }
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!data.user || data.user.id !== userId) {
      return res.status(401).json({ message: "Session invalid" });
    }

    (req as any).userId = data.user.id;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Authentication error" });
  }
};
