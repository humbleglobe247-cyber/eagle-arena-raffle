import express from "express";
import { env } from "./config/env";
import adminRoutes from "./routes/adminRoutes"
import prizeRoutes from "./routes/prizeRoutes"
import { errorHandler } from "./middleware/errorHandler";
import settingsRoutes from "./routes/settingsRoutes"
import publicRoutes from "./routes/publicRoutes";
import systemRoutes from "./routes/systemRoutes";
import docsRoutes from "./routes/docsRoutes";
import devRoutes from "./routes/devRoutes";
import winnerRoutes from "./routes/winnerRoutes";
import salesRoutes from "./routes/salesRoutes";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter";
import { startCleanupJob } from "./jobs/cleanupJob";



const app = express();

// How many proxies in front of the server (0 locally). needed for correct clients IPs .
app.set("trust proxy", env.trustProxy);


if (env.nodeEnv !== "production") {
  app.use("/api/docs", docsRoutes);
}

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // No Origin means a tool or a server (Postman, a payment webhook), not a browser page.
      callback(null, !origin || env.corsOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);


// Everything we accept as JSON is small. Image uploads have their own 5MB limit.
app.use(express.json({ limit: "20kb" }));
app.use("/api", systemRoutes);
app.use("/api", apiLimiter);
app.use("/api/admin", adminRoutes)
app.use("/api/admin/prizes", prizeRoutes)
app.use("/api/admin/settings", settingsRoutes)
app.use("/api/public", publicRoutes);
app.use("/api/admin/winners", winnerRoutes);
app.use("/api/admin/sales", salesRoutes)



if (env.paymentProvider === "mock" && env.nodeEnv !== "production") {
  app.use("/api/dev", devRoutes);
}


app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  startCleanupJob();
});