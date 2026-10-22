
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

// POST /api/submissions/:assignmentId
exports.createSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;

    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.trim().length > 50000
    ) {
      return res.status(400).json({
        message:
          "Submission content is required and must not exceed 50,000 characters.",
      });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.status !== "PUBLISHED") {
      return res.status(404).json({
        message: "Published assignment not found.",
      });
    }

    if (new Date(assignment.deadline) <= new Date()) {
      return res.status(400).json({
        message: "The submission deadline has passed.",
      });
    }

    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      content: content.trim(),
    });

    return res.status(201).json({
      message: "Assignment submitted successfully.",
      submission: {
        id: submission._id,
        assignment: submission.assignment,
        submittedAt: submission.submittedAt,
        status: submission.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "You have already submitted this assignment.",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid assignment ID.",
      });
    }

    console.error("Submission error:", error.message);

    return res.status(500).json({
      message: "Unable to submit assignment.",
    });
  }
};

// GET /api/submissions/mine
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.user._id,
    })
      .populate("assignment", "title courseName deadline maxMarks")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get submissions error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve submissions.",
    });
  }
};
