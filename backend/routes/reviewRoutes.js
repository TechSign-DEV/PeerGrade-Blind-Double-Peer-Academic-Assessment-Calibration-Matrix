
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const {
  allocateAssignmentReviews,
  getMyReviews,
  submitPeerReview
} = require("../controllers/reviewController");

const {
  getAssignmentCalibration
} = require("../controllers/calibrationController");

// Instructor: allocate peer reviews.
router.post(
  "/allocate/:assignmentId",
  protect,
  authorize("INSTRUCTOR"),
  allocateAssignmentReviews
);

// Student: view assigned peer reviews.
router.get(
  "/mine",
  protect,
  authorize("STUDENT"),
  getMyReviews
);

// Student: submit a peer review.
router.post(
  "/:reviewId/submit",
  protect,
  authorize("STUDENT"),
  submitPeerReview
);

// Instructor: view statistical calibration for their assignment.
router.get(
  "/calibration/:assignmentId",
  protect,
  authorize("INSTRUCTOR"),
  getAssignmentCalibration
);

module.exports = router;
