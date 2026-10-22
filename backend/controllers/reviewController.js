
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const ReviewAssignment = require("../models/ReviewAssignment");
const { allocateReviews } = require("../services/reviewAllocationService");

// POST /api/reviews/allocate/:assignmentId
exports.allocateAssignmentReviews = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        message: "Invalid assignment ID.",
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      instructor: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found for this instructor.",
      });
    }

    if (assignment.status !== "PUBLISHED") {
      return res.status(400).json({
        message: "Only published assignments can be allocated.",
      });
    }

    const result = await allocateReviews(assignmentId);

    return res.status(200).json({
      message: "Peer review allocation processed successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Review allocation error:", error.message);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to allocate peer reviews.",
    });
  }
};

// GET /api/reviews/mine
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await ReviewAssignment.find({
      reviewer: req.user._id,
    })
      .populate({
        path: "submission",
        select: "content submittedAt assignment",
        populate: {
          path: "assignment",
          select: "title courseName deadline maxMarks rubric",
        },
      })
      .sort({ assignedAt: -1 })
      .lean();

    // Explicitly construct the response so author information
    // is never returned by this endpoint.
    const anonymousReviews = reviews
      .filter((review) => review.submission)
      .map((review) => ({
        reviewId: review._id,
        status: review.status,
        assignedAt: review.assignedAt,
        submission: {
          id: review.submission._id,
          content: review.submission.content,
          submittedAt: review.submission.submittedAt,
          assignment: review.submission.assignment,
        },
      }));

    return res.status(200).json({
      count: anonymousReviews.length,
      reviews: anonymousReviews,
    });
  } catch (error) {
    console.error("Get peer reviews error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve assigned reviews.",
    });
  }
};


// POST /api/reviews/:reviewId/submit
exports.submitPeerReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rubricScores, overallFeedback } = req.body;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        message: "Invalid review ID.",
      });
    }

    if (!Array.isArray(rubricScores)) {
      return res.status(400).json({
        message: "Rubric scores must be provided.",
      });
    }

    if (
      typeof overallFeedback !== "string" ||
      overallFeedback.trim().length > 5000
    ) {
      return res.status(400).json({
        message: "Overall feedback must be at most 5000 characters.",
      });
    }

    const review = await ReviewAssignment.findOne({
      _id: reviewId,
      reviewer: req.user._id,
      status: "PENDING",
    });

    if (!review) {
      return res.status(404).json({
        message: "Pending review not found for your account.",
      });
    }

    const submission = await Submission.findById(
      review.submission
    );

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found.",
      });
    }

    // Never allow a student to review their own submission.
    if (submission.student.toString() === req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot review your own submission.",
      });
    }

    const assignment = await Assignment.findById(
      review.assignment
    );

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found.",
      });
    }

    const rubric = assignment.rubric || [];

    if (rubric.length === 0) {
      return res.status(400).json({
        message: "This assignment has no grading rubric.",
      });
    }

    if (rubricScores.length !== rubric.length) {
      return res.status(400).json({
        message: "Provide a score for every rubric criterion.",
      });
    }

    const normalizedScores = [];

    for (const criterion of rubric) {
      const score = rubricScores.find(
        (item) =>
          item.criterionId === criterion._id.toString()
      );

      if (
        !score ||
        typeof score.marks !== "number" ||
        !Number.isFinite(score.marks) ||
        score.marks < 0 ||
        score.marks > criterion.maxMarks ||
        (score.feedback !== undefined &&
          (typeof score.feedback !== "string" ||
            score.feedback.length > 2000))
      ) {
        return res.status(400).json({
          message: `Invalid marks or feedback for ${criterion.criterion}.`,
        });
      }

      normalizedScores.push({
        criterionId: criterion._id,
        criterion: criterion.criterion,
        marks: score.marks,
        maxMarks: criterion.maxMarks,
        feedback: score.feedback || "",
      });
    }

    // Conditional update prevents two requests from completing
    // the same review simultaneously.
    const updatedReview = await ReviewAssignment.findOneAndUpdate(
      {
        _id: review._id,
        reviewer: req.user._id,
        status: "PENDING",
      },
      {
        $set: {
          rubricScores: normalizedScores,
          overallFeedback: overallFeedback.trim(),
          completedAt: new Date(),
          status: "COMPLETED",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return res.status(409).json({
        message: "This review has already been submitted.",
      });
    }

    return res.status(200).json({
      message: "Peer review submitted successfully.",
      review: {
        id: updatedReview._id,
        status: updatedReview.status,
        completedAt: updatedReview.completedAt,
      },
    });
  } catch (error) {
    console.error("Submit peer review error:", error.message);

    return res.status(500).json({
      message: "Unable to submit peer review.",
    });
  }
};
