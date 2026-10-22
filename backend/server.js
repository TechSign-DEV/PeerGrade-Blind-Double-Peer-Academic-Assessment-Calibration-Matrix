
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "PeerGrade API is running",
    status: "success",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    application: "PeerGrade",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/admin", adminRoutes);
// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

// Start server only after MongoDB connects
const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`PeerGrade server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start PeerGrade:", error.message);
  process.exit(1);
});
