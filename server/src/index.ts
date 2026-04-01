import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import passwordResetRoutes from "./routes/passwordReset.js";
import serverRoutes from "./routes/servers.js";
import websiteRoutes from "./routes/websites.js";
import appRoutes from "./routes/apps.js";
import serverAppRoutes from "./routes/serverApps.js";
import currencyRoutes from "./routes/currencies.js";
import locationRoutes from "./routes/locations.js";
import providerRoutes from "./routes/providers.js";
import cpuTypeRoutes from "./routes/cpuTypes.js";
import osRoutes from "./routes/operatingSystems.js";
import serverTypeRoutes from "./routes/serverTypes.js";
import billingPeriodRoutes from "./routes/billingPeriods.js";
import paymentMethodRoutes from "./routes/paymentMethods.js";
import userRoutes from "./routes/users.js";
import backupRoutes from "./routes/backup.js";
import { authenticate, checkPasswordChangeRequired } from "./middleware/auth.js";
import { csrfProtection } from "./middleware/csrf.js";
import { loginLimiter, passwordResetLimiter } from "./middleware/rateLimit.js";

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy for shared hosting environments (Apache/Nginx reverse proxy)
// This allows rate limiting to work correctly with X-Forwarded-For headers
app.set('trust proxy', true);

// Security: Helmet adds various HTTP security headers
app.use(helmet());

// Security: Configure CORS to restrict origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(express.json());
app.use(cookieParser());

// Rate-limited auth endpoints
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/forgot-password", passwordResetLimiter);

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordResetRoutes);

// Protected routes (with password change enforcement and CSRF protection)
app.use("/api/servers", authenticate, checkPasswordChangeRequired, csrfProtection, serverRoutes);
app.use("/api/servers", authenticate, checkPasswordChangeRequired, csrfProtection, websiteRoutes);
app.use("/api/servers", authenticate, checkPasswordChangeRequired, csrfProtection, serverAppRoutes);
app.use("/api/apps", authenticate, checkPasswordChangeRequired, csrfProtection, appRoutes);
app.use("/api/currencies", authenticate, checkPasswordChangeRequired, csrfProtection, currencyRoutes);
app.use("/api/locations", authenticate, checkPasswordChangeRequired, csrfProtection, locationRoutes);
app.use("/api/providers", authenticate, checkPasswordChangeRequired, csrfProtection, providerRoutes);
app.use("/api/cpu-types", authenticate, checkPasswordChangeRequired, csrfProtection, cpuTypeRoutes);
app.use("/api/os", authenticate, checkPasswordChangeRequired, csrfProtection, osRoutes);
app.use("/api/server-types", authenticate, checkPasswordChangeRequired, csrfProtection, serverTypeRoutes);
app.use("/api/billing-periods", authenticate, checkPasswordChangeRequired, csrfProtection, billingPeriodRoutes);
app.use("/api/payment-methods", authenticate, checkPasswordChangeRequired, csrfProtection, paymentMethodRoutes);
app.use("/api/users", authenticate, checkPasswordChangeRequired, csrfProtection, userRoutes);
app.use("/api/backup", authenticate, checkPasswordChangeRequired, csrfProtection, backupRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
