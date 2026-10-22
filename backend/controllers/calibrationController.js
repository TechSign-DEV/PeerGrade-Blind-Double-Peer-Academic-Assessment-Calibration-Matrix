
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const ReviewAssignment = require("../models/ReviewAssignment");

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

function average(values) {
  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function standardDeviation(values) {
  if (!values.length) return null;

  const mean = average(values);
  const variance = average(
    values.map((value) => (value - mean) ** 2)
  );

  return Math.sqrt(variance);
}

exports.getAssignmentCalibration = async (req, res) => {
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

    const reviews = await ReviewAssignment.find({
      assignment: assignmentId,
      status: "COMPLETED"
    })
      .populate({
        path: "submission",
        select: "_id assignment"
      })
      .populate({
        path: "reviewer",
        select: "name email"
      })
      .lean();

    // Keep only valid completed reviews with usable scores.
    const usableReviews = reviews
      .filter((review) =>
        review.submission &&
        review.reviewer &&
        String(review.submission.assignment) === String(assignment._id)
      )
      .map((review) => ({
        reviewId: String(review._id),
        submissionId: String(review.submission._id),
        reviewerId: String(review.reviewer._id),
        reviewerName: review.reviewer.name,
        reviewerEmail: review.reviewer.email,
        percentage: getReviewPercentage(review)
      }))
      .filter((review) => Number.isFinite(review.percentage));

    const reviewsBySubmission = new Map();
    const reviewsByReviewer = new Map();

    for (const review of usableReviews) {
      if (!reviewsBySubmission.has(review.submissionId)) {
        reviewsBySubmission.set(review.submissionId, []);
      }

      reviewsBySubmission.get(review.submissionId).push(review);

      if (!reviewsByReviewer.has(review.reviewerId)) {
        reviewsByReviewer.set(review.reviewerId, {
          reviewerId: review.reviewerId,
          reviewerName: review.reviewerName,
          reviewerEmail: review.reviewerEmail,
          deviations: [],
          completedReviews: 0
        });
      }

      reviewsByReviewer.get(review.reviewerId).completedReviews += 1;
    }

    // Submission-level score agreement.
    const submissionResults = [];

    for (const [submissionId, submissionReviews] of reviewsBySubmission) {
      const percentages = submissionReviews.map(
        (review) => review.percentage
      );

      const mean = average(percentages);

      submissionResults.push({
        submissionId,
        completedReviewCount: submissionReviews.length,
        averagePercentage: Number(mean.toFixed(2)),
        averageMarks: Number(
          ((mean / 100) * assignment.maxMarks).toFixed(2)
        ),
        lowestPercentage: Number(
          Math.min(...percentages).toFixed(2)
        ),
        highestPercentage: Number(
          Math.max(...percentages).toFixed(2)
        ),
        standardDeviationPoints: Number(
          standardDeviation(percentages).toFixed(2)
        )
      });

      // Compare each reviewer with the other completed reviewers
      // of this same submission, excluding their own score.
      for (const review of submissionReviews) {
        const otherScores = submissionReviews
          .filter((other) => other.reviewId !== review.reviewId)
          .map((other) => other.percentage);

        if (!otherScores.length) continue;

        const peerConsensus = average(otherScores);
        const reviewerStats = reviewsByReviewer.get(review.reviewerId);

        reviewerStats.deviations.push(
          review.percentage - peerConsensus
        );
      }
    }

    // Reviewer-level signals. These are diagnostic, not disciplinary.
    const reviewerResults = Array.from(reviewsByReviewer.values())
      .map((reviewer) => {
        const deviation = average(reviewer.deviations);
        const enoughReviews = reviewer.completedReviews >= 5;

        let signal = "INSUFFICIENT_DATA";

        if (enoughReviews && deviation !== null) {
          if (deviation >= 10) {
            signal = "TENDS_HIGHER";
          } else if (deviation <= -10) {
            signal = "TENDS_LOWER";
          } else {
            signal = "WITHIN_RANGE";
          }
        }

        return {
          reviewerId: reviewer.reviewerId,
          reviewerName: reviewer.reviewerName,
          reviewerEmail: reviewer.reviewerEmail,
          completedReviews: reviewer.completedReviews,
          averageDeviationPoints:
            deviation === null ? null : Number(deviation.toFixed(2)),
          calibrationSignal: signal
        };
      })
      .sort((a, b) =>
        (a.averageDeviationPoints ?? 0) -
        (b.averageDeviationPoints ?? 0)
      );

    return res.status(200).json({
      assignment: {
        id: String(assignment._id),
        title: assignment.title,
        maxMarks: assignment.maxMarks
      },
      summary: {
        completedPeerReviews: usableReviews.length,
        submissionsReviewed: submissionResults.length,
        reviewersIncluded: reviewerResults.length
      },
      submissions: submissionResults,
      reviewers: reviewerResults,
      interpretation: {
        deviationUnit: "percentage points",
        minimumReviewsForSignal: 5,
        thresholdPoints: 10,
        warning:
          "Calibration signals are prompts for instructor review, not proof of bias or misconduct. Small samples and differences in submission quality can affect results."
      }
    });
  } catch (error) {
    console.error("Calibration report error:", error.message);

    return res.status(500).json({
      message: "Could not generate the calibration report."
    });
  }
};
