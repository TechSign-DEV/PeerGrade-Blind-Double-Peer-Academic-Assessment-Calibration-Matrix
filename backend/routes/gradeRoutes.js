
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const {
  calculateAssignmentGrades,
  getAssignmentGrades,
  releaseGrade,
  getMyGrades,
  updateGradeFeedback
} = require("../controllers/gradeController");

// Instructor: calculate draft grades.
router.post(
  "/calculate/:assignmentId",
  protect,
  authorize("INSTRUCTOR"),
  calculateAssignmentGrades
);

// Instructor: view grades for an assignment they own.
router.get(
  "/assignment/:assignmentId",
  protect,
  authorize("INSTRUCTOR"),
  getAssignmentGrades
);
router.patch(
  "/:gradeId/feedback",
  protect,
  authorize("INSTRUCTOR"),
  updateGradeFeedback
);
// Instructor: release one grade.
router.patch(
  "/:gradeId/release",
  protect,
  authorize("INSTRUCTOR"),
  releaseGrade
);

// Student: view only released grades belonging to them.
router.get(
  "/mine",
  protect,
  authorize("STUDENT"),
  getMyGrades
);

module.exports = router;
