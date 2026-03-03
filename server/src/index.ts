import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import serverRoutes from "./routes/servers.js";
import websiteRoutes from "./routes/websites.js";
import currencyRoutes from "./routes/currencies.js";
import locationRoutes from "./routes/locations.js";
import providerRoutes from "./routes/providers.js";
import cpuTypeRoutes from "./routes/cpuTypes.js";
import osRoutes from "./routes/operatingSystems.js";
import serverTypeRoutes from "./routes/serverTypes.js";
import userRoutes from "./routes/users.js";
import backupRoutes from "./routes/backup.js";
import { authenticate } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/servers", authenticate, serverRoutes);
app.use("/api/servers", authenticate, websiteRoutes);
app.use("/api/currencies", authenticate, currencyRoutes);
app.use("/api/locations", authenticate, locationRoutes);
app.use("/api/providers", authenticate, providerRoutes);
app.use("/api/cpu-types", authenticate, cpuTypeRoutes);
app.use("/api/os", authenticate, osRoutes);
app.use("/api/server-types", authenticate, serverTypeRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/backup", authenticate, backupRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
