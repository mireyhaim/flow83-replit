import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startEmailCron } from "./emailCron";
import { db } from "./db";
import { sql } from "drizzle-orm";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const RLS_TABLES = [
  "users", "sessions", "journeys", "journey_steps", "journey_blocks",
  "journey_messages", "journey_feedback", "participants", "payments",
  "user_day_state", "activity_events", "notification_settings",
  "external_payment_sessions", "system_errors", "invoices",
  "mentor_business_profiles", "mentor_wallets", "wallet_transactions",
  "withdrawal_requests", "refund_requests"
];

async function initRLS() {
  log('Ensuring RLS is enabled on all tables...', 'rls');
  
  for (const table of RLS_TABLES) {
    try {
      await db.execute(sql.raw(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
      
      const policyName = `service_role_all_${table}`;
      await db.execute(sql.raw(`DROP POLICY IF EXISTS ${policyName} ON public.${table}`));
      await db.execute(sql.raw(
        `CREATE POLICY ${policyName} ON public.${table} FOR ALL USING (current_setting('app.role', true) = 'service')`
      ));
    } catch (error: any) {
      if (!error.message?.includes("does not exist")) {
        log(`RLS warning for ${table}: ${error.message}`, 'rls');
      }
    }
  }
  
  log('RLS enabled on all tables', 'rls');
}

(async () => {
  await initRLS();

  app.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  
  // Track active connections for graceful shutdown
  const activeConnections = new Map<any, boolean>();
  httpServer.on('connection', (conn) => {
    activeConnections.set(conn, true);
    conn.on('close', () => activeConnections.delete(conn));
  });
  
  // Graceful shutdown handler
  const gracefulShutdown = (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`, 'express');
    
    // Stop accepting new connections
    httpServer.close(() => {
      log('Server closed', 'express');
      process.exit(0);
    });
    
    // Close all active connections
    activeConnections.forEach((_, conn) => {
      conn.end();
    });
    
    // Force close after 3 seconds
    setTimeout(() => {
      log('Forcing shutdown, closing all connections...', 'express');
      activeConnections.forEach((_, conn) => {
        conn.destroy();
      });
      process.exit(1);
    }, 3000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle server errors gracefully with limited retries
  let retryCount = 0;
  const maxRetries = 5;
  
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      retryCount++;
      if (retryCount <= maxRetries) {
        log(`Port ${port} is busy, attempt ${retryCount}/${maxRetries}. Retrying in 2 seconds...`, 'express');
        setTimeout(() => {
          httpServer.close();
          httpServer.listen({ port, host: "0.0.0.0" });
        }, 2000);
      } else {
        log(`Port ${port} still busy after ${maxRetries} attempts. Exiting...`, 'express');
        process.exit(1);
      }
    } else {
      log(`Server error: ${error.message}`, 'express');
      throw error;
    }
  });

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      
      // Start email cron jobs
      startEmailCron();
    },
  );
})();
