// console.log('Starting server/index.ts...');
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { checkDatabaseConnection } from './db';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import discordIntegrationsRouter from './routes/discordIntegrations';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5052;

app.use(cors());
app.use(express.json());

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// API routes
app.get('/api/test-db', async (req, res) => {
  const result = await checkDatabaseConnection();
  if (result === true) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: result });
  }
});

// Test JSON body parsing
app.post('/api/test-json', (req, res) => {
  res.json({ body: req.body });
});

app.post('/test-json', (req, res) => {
  res.json({ body: req.body });
});

app.use(discordIntegrationsRouter);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files from the dist/public directory (moved below API routes)
  app.use(express.static(path.join(__dirname, '../dist/public')));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the client-side app for all other routes - moved to end
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });

  server.listen(port, () => {
    log(`Server running at http://localhost:${port}`);
  });
})();
