import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
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
import { authenticate } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 3000;

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
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/servers", authenticate, serverRoutes);
app.use("/api/servers", authenticate, websiteRoutes);
app.use("/api/servers", authenticate, serverAppRoutes);
app.use("/api/apps", authenticate, appRoutes);
app.use("/api/currencies", authenticate, currencyRoutes);
app.use("/api/locations", authenticate, locationRoutes);
app.use("/api/providers", authenticate, providerRoutes);
app.use("/api/cpu-types", authenticate, cpuTypeRoutes);
app.use("/api/os", authenticate, osRoutes);
app.use("/api/server-types", authenticate, serverTypeRoutes);
app.use("/api/billing-periods", authenticate, billingPeriodRoutes);
app.use("/api/payment-methods", authenticate, paymentMethodRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/backup", authenticate, backupRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
