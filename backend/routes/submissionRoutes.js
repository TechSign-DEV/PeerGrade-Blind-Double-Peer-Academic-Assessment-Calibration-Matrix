
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  createSubmission,
  getMySubmissions,
} = require("../controllers/submissionController");

// Students can submit work
router.post(
  "/:assignmentId",
  protect,
  authorize("STUDENT"),
  createSubmission
);

// Students can view their own submissions
router.get(
  "/mine",
  protect,
  authorize("STUDENT"),
  getMySubmissions
);

module.exports = router;
