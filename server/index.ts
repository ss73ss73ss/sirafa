import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getJwtSecret, getEnvironmentStatus } from "./utils/jwt";

const app = express();

// ضبط Express ليثق في proxy headers للحصول على IP الحقيقي (1 hop for Replit)
app.set('trust proxy', 1);

// إعداد CORS
const clientOrigin = process.env.CLIENT_ORIGIN || 'https://<MY_DOMAIN>.com';
app.use(cors({ origin: clientOrigin, credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use('/uploads', express.static('public/uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    // Sanitize response body to prevent JWT token leakage in logs
    if (bodyJson && typeof bodyJson === 'object') {
      const sanitizedBody = { ...bodyJson };
      // Mask sensitive fields that might contain JWT tokens
      if (sanitizedBody.token) sanitizedBody.token = '***';
      if (sanitizedBody.accessToken) sanitizedBody.accessToken = '***';
      if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '***';
      if (sanitizedBody.jwt) sanitizedBody.jwt = '***';
      capturedJsonResponse = sanitizedBody;
    } else {
      capturedJsonResponse = bodyJson;
    }
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

(async () => {
  // 🔍 Environment validation and warnings
  const envStatus = getEnvironmentStatus();
  console.log(`🌍 Environment: ${envStatus.nodeEnv}`);
  console.log(`🔐 JWT_SECRET: ${envStatus.jwtSecretConfigured ? 'Configured from environment' : 'Using fallback generation'}`);
  
  if (envStatus.isProduction && envStatus.usingFallback) {
    console.warn("⚠️ DEPLOYMENT RECOMMENDATION: Add JWT_SECRET to your deployment secrets for enhanced security");
  }

  // 🔐 Initialize JWT secret (now with fallback support)
  try {
    getJwtSecret();
    console.log("✅ JWT secret validation passed at startup");
  } catch (error) {
    console.error("🚨 CRITICAL ERROR: JWT secret initialization failed:", error instanceof Error ? error.message : error);
    console.error("🚨 This should not happen with the new fallback system. Please check the implementation.");
    process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // معالجة خاصة لأخطاء قاعدة البيانات
    if (err.message?.includes('Connection timeout') || err.message?.includes('connect')) {
      message = "خطأ في الاتصال بقاعدة البيانات. يتم إعادة المحاولة...";
      console.log("🔄 خطأ اتصال قاعدة البيانات:", err.message);
    }

    res.status(status).json({ message });
    
    if (status === 500) {
      console.error("خطأ خادم:", err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
