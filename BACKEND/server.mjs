import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { getDatabase } from "./db/conn.mjs";

/* ROUTES */
import mentorstudentassignment from "./routes/mentorstudentassignment.mjs";
import onboardstudents from "./routes/onboardstudents.mjs";
import onboardmentors from "./routes/onboardmentors.mjs";
import programs from "./routes/programs.mjs";
import tracks from "./routes/tracks.mjs";
import assessments from "./routes/assessments.mjs";
import resources from "./routes/resources.mjs";
import events from "./routes/events.mjs";
import mentordashboard from "./routes/mentordashboard.mjs";
import cohorts from "./routes/cohorts.mjs";
import studentassignment from "./routes/studentassignment.js";
import auth from "./routes/auth.js";
import user from "./routes/user.mjs";
import addassignment from "./routes/addassignment.mjs";
import mentorship from "./routes/mentorship.mjs";
import internship from "./routes/internship.mjs";
import skillsdevelopment from "./routes/skillsdevelopment.js";
import modules from "./routes/modules.mjs";
import projects from "./routes/projects.mjs";
import announcements from "./routes/announcements.mjs";
import accesscontrol from "./routes/accesscontrol.mjs";
import adminlogin from "./routes/adminlogin.mjs";
import addtask from "./routes/addtask.mjs";
import helpRequests from "./routes/help-requests.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* UPLOADS DIR */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* MIDDLEWARE */
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://platformontrackconnect.co.za"]
    : ["http://localhost:3001"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

app.use(mongoSanitize());
app.use(helmet());

/* DATABASE MIDDLEWARE (BEFORE ROUTES) */
app.use(async (req, res, next) => {
  try {
    req.db = await getDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

/* ROUTES */
app.use("/api/onboardstudents", onboardstudents);
app.use("/api/onboardmentors", onboardmentors);
app.use("/api/mentorstudentassignment", mentorstudentassignment);
app.use("/api/mentordashboard", mentordashboard);
app.use("/api/programs", programs);
app.use("/api/tracks", tracks);
app.use("/api/assessments", assessments);
app.use("/api/resources", resources);
app.use("/api/events", events);
app.use("/api/cohorts", cohorts);
app.use("/api/studentassignment", studentassignment);
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/adminlogin", adminlogin);
app.use("/api/addassignment", addassignment);
app.use("/api/accesscontrol", accesscontrol);
app.use("/api/mentorship", mentorship);
app.use("/api/internship", internship);
app.use("/api/skillsdevelopment", skillsdevelopment);
app.use("/api/modules", modules);
app.use("/api/projects", projects);
app.use("/api/announcements", announcements);
app.use("/api/addtask", addtask);
app.use("/api/help-requests", helpRequests);

/* HEALTH */
app.get("/api/health", async (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ROOT */
app.get("/", (req, res) => {
  res.json({
    message: "OnTrack Connect API",
    status: "RUNNING",
  });
});

/* 404 */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
