import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import labRoutes from "./routes/labRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];
app.use(cors({ origin: (origin, cb) => cb(null, true) }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "SwasthyaSetu API" }));

// Public
app.use("/auth", authRoutes);

// Protected — require valid JWT on all clinical routes
app.use("/patient", requireAuth, patientRoutes);
app.use("/consultation", requireAuth, consultationRoutes);
app.use("/lab", requireAuth, labRoutes);
app.use("/pharmacy", requireAuth, pharmacyRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`SwasthyaSetu API running on port ${PORT}`));
});

export default app;
