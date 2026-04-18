import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import { initDatabase } from "./db/sqlite.js";

dotenv.config();

const app = express();

// ✅ FINAL CORS FIX (NO MORE ERRORS)
app.use(cors({
  origin: true,          // allow all origins (fixes AWS + Render issues)
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/resume", resumeRoutes);

app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// Start server
initDatabase()
  .then(() => {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Server start failed:", err.message);
    process.exit(1);
  });
