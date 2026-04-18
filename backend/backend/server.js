import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import { initDatabase } from "./db/sqlite.js";

dotenv.config();

const app = express();

// ✅ FIXED CORS (ALLOW MULTIPLE FRONTENDS)
const allowedOrigins = [
  "https://main.d10pc2v5wpdbva.amplifyapp.com",
  "https://main.d2lpl9mcmjfsf.amplifyapp.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
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
