
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const ReviewAssignment = require("../models/ReviewAssignment");
const Grade = require("../models/Grade");

function getReviewPercentage(review) {
  const scores = review.rubricScores || [];

  const totalMarks = scores.reduce(
    (sum, score) => sum + score.marks,
    0
  );

  const totalPossible = scores.reduce(
    (sum, score) => sum + score.maxMarks,
    0
  );

  if (totalPossible <= 0) return null;

  return (totalMarks / totalPossible) * 100;
}

// Instructor: calculate or refresh draft grades.
exports.calculateAssignmentGrades = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        message: "Invalid assignment ID."
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      instructor: req.user._id
    }).lean();

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found or you do not own it."
      });
    }

    const submissions = await Submission.find({
      assignment: assignmentId
    })
      .select("_id student")
      .lean();

    const submissionById = new Map(
      submissions.map((submission) => [
        String(submission._id),
        submission
      ])
    );

    const completedReviews = await ReviewAssignment.find({
      assignment: assignmentId,
      status: "COMPLETED"
    }).lean();

    const reviewsBySubmission = new Map();

    for (const review of completedReviews) {
      const submissionId = String(review.submission);
      const submission = submissionById.get(submissionId);

      if (!submission) continue;

      const percentage = getReviewPercentage(review);

      if (!Number.isFinite(percentage)) continue;

      if (!reviewsBySubmission.has(submissionId)) {
        reviewsBySubmission.set(submissionId, []);
      }

      reviewsBySubmission.get(submissionId).push(percentage);
    }

    let createdOrUpdated = 0;
    let awaitingReviews = 0;
    let releasedGradesPreserved = 0;

    for (const [submissionId, percentages] of reviewsBySubmission) {
      // Require both assigned peer reviews before calculating a draft.
      if (percentages.length < 2) {
        awaitingReviews += 1;
        continue;
      }

      const submission = submissionById.get(submissionId);

      const averagePercentage =
        percentages.reduce((sum, value) => sum + value, 0) /
        percentages.length;

      const calculatedMarks = Number(
        Math.min(
          assignment.maxMarks,
          Math.max(0, (averagePercentage / 100) * assignment.maxMarks)
        ).toFixed(2)
      );

      const existingGrade = await Grade.findOne({
        assignment: assignmentId,
        submission: submissionId
      });

      if (existingGrade?.status === "RELEASED") {
        releasedGradesPreserved += 1;
        continue;
      }

      await Grade.findOneAndUpdate(
        {
          assignment: assignmentId,
          submission: submissionId
        },
        {
          $set: {
            student: submission.student,
            calculatedMarks,
            maxMarks: assignment.maxMarks,
            peerReviewCount: percentages.length,
            calculationMethod:
              "AVERAGE_OF_COMPLETED_PEER_REVIEWS",
            status: "DRAFT"
          },
          $setOnInsert: {
            assignment: assignmentId,
            submission: submissionId
          }
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      createdOrUpdated += 1;
    }

    // Also count submissions that have no usable completed reviews.
    const submissionsWithReviews = new Set(
      reviewsBySubmission.keys()
    );

    for (const submission of submissions) {
      if (!submissionsWithReviews.has(String(submission._id))) {
        awaitingReviews += 1;
      }
    }

    return res.status(200).json({
      message: "Grade calculation completed.",
      assignmentId: String(assignment._id),
      submissionsFound: submissions.length,
      draftGradesCreatedOrUpdated: createdOrUpdated,
      submissionsAwaitingReviews: awaitingReviews,
      releasedGradesPreserved
    });
  } catch (error) {
    console.error("Grade calculation error:", error.message);

    return res.status(500).json({
      message: "Could not calculate assignment grades."
    });
  }
};

// Instructor: inspect draft and released grades for their assignment.
exports.getAssignmentGrades = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        message: "Invalid assignment ID."
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      instructor: req.user._id
    }).lean();

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found or you do not own it."
      });
    }

    const grades = await Grade.find({
      assignment: assignmentId
    })
      .populate("student", "name email")
      .populate("submission", "submittedAt status")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      assignment: {
        id: String(assignment._id),
        title: assignment.title,
        maxMarks: assignment.maxMarks
      },
      grades
    });
  } catch (error) {
    console.error("Get assignment grades error:", error.message);

    return res.status(500).json({
      message: "Could not load assignment grades."
    });
  }
};

// Instructor: release a draft grade to the student.
exports.releaseGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    if (!mongoose.isValidObjectId(gradeId)) {
      return res.status(400).json({
        message: "Invalid grade ID."
      });
    }

    const grade = await Grade.findById(gradeId);

    if (!grade) {
      return res.status(404).json({
        message: "Grade not found."
      });
    }

    const assignment = await Assignment.findOne({
      _id: grade.assignment,
      instructor: req.user._id
    });

    if (!assignment) {
      return res.status(403).json({
        message: "You cannot release grades for this assignment."
      });
    }

    if (grade.status === "RELEASED") {
      return res.status(409).json({
        message: "This grade has already been released."
      });
    }

    if (
      !Number.isFinite(grade.calculatedMarks) ||
      grade.calculatedMarks < 0 ||
      grade.calculatedMarks > grade.maxMarks ||
      grade.peerReviewCount < 2
    ) {
      return res.status(400).json({
        message: "The grade is not valid for release."
      });
    }

    grade.status = "RELEASED";
    grade.releasedAt = new Date();
    grade.releasedBy = req.user._id;

    await grade.save();

    return res.status(200).json({
      message: "Grade released successfully.",
      grade: {
        id: String(grade._id),
        calculatedMarks: grade.calculatedMarks,
        maxMarks: grade.maxMarks,
        status: grade.status,
        releasedAt: grade.releasedAt
      }
    });
  } catch (error) {
    console.error("Release grade error:", error.message);

    return res.status(500).json({
      message: "Could not release the grade."
    });
  }
};

exports.updateGradeFeedback = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { instructorFeedback } = req.body;

    if (!mongoose.isValidObjectId(gradeId)) {
      return res.status(400).json({
        message: "Invalid grade ID."
      });
    }

    if (
      typeof instructorFeedback !== "string" ||
      instructorFeedback.length > 5000
    ) {
      return res.status(400).json({
        message: "Feedback must be text containing at most 5000 characters."
      });
    }

    const grade = await Grade.findById(gradeId);

    if (!grade) {
      return res.status(404).json({
        message: "Grade not found."
      });
    }

    const assignment = await Assignment.findOne({
      _id: grade.assignment,
      instructor: req.user._id
    });

    if (!assignment) {
      return res.status(403).json({
        message: "You cannot edit feedback for this grade."
      });
    }

    if (grade.status === "RELEASED") {
      return res.status(409).json({
        message: "Feedback cannot be changed after grade release."
      });
    }

    grade.instructorFeedback = instructorFeedback.trim();
    await grade.save();

    return res.status(200).json({
      message: "Instructor feedback saved.",
      gradeId: String(grade._id)
    });
  } catch (error) {
    console.error("Update grade feedback error:", error.message);

    return res.status(500).json({
      message: "Could not save instructor feedback."
    });
  }
};


// Student: view only their own released grades.
exports.getMyGrades = async (req, res) => {
  try {
    const grades = await Grade.find({
      student: req.user._id,
      status: "RELEASED"
    })
      .populate("assignment", "title courseName maxMarks")
      .populate("submission", "submittedAt")
      .sort({ releasedAt: -1 })
      .lean();

    return res.status(200).json({ grades });
  } catch (error) {
    console.error("Get student grades error:", error.message);

    return res.status(500).json({
      message: "Could not load your released grades."
    });
  }
};
