
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  createAssignment,
  getAssignments,
  getMyAssignments,
} = require("../controllers/assignmentController");

// Students and instructors can view published assignments
router.get("/", protect, getAssignments);

// Instructor-only routes
router.get(
  "/mine",
  protect,
  authorize("INSTRUCTOR"),
  getMyAssignments
);

router.post(
  "/",
  protect,
  authorize("INSTRUCTOR"),
  createAssignment
);

module.exports = router;
