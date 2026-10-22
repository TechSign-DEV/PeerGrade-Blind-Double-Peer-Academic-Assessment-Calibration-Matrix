
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const ReviewAssignment = require("../models/ReviewAssignment");

async function allocateReviews(assignmentId) {
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    throw new Error("Invalid assignment ID.");
  }

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const submissions = await Submission.find({
    assignment: assignmentId,
  }).select("_id student");

  if (submissions.length < 3) {
    throw new Error(
      "At least 3 student submissions are required to allocate peer reviews."
    );
  }

  const existingReviews = await ReviewAssignment.find({
    assignment: assignmentId,
  }).select("submission reviewer");

  const existingPairs = new Set(
    existingReviews.map(
      (review) =>
        `${review.submission.toString()}_${review.reviewer.toString()}`
    )
  );

  const workload = new Map();

  for (const review of existingReviews) {
    const reviewerId = review.reviewer.toString();
    workload.set(
      reviewerId,
      (workload.get(reviewerId) || 0) + 1
    );
  }

  const students = submissions.map((submission) => ({
    submissionId: submission._id.toString(),
    studentId: submission.student.toString(),
  }));

  // Randomize the order in which submissions are processed.
  for (let i = students.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [students[i], students[j]] = [students[j], students[i]];
  }

  let newReviewsAllocated = 0;

  for (const target of students) {
    const currentReviews = await ReviewAssignment.countDocuments({
      assignment: assignmentId,
      submission: target.submissionId,
    });

    const needed = Math.max(0, 2 - currentReviews);

    if (needed === 0) continue;

    // Never assign a student to review their own submission.
    const candidates = students
      .filter(
        (student) =>
          student.studentId !== target.studentId &&
          !existingPairs.has(
            `${target.submissionId}_${student.studentId}`
          )
      )
      .sort(
        (a, b) =>
          (workload.get(a.studentId) || 0) -
          (workload.get(b.studentId) || 0)
      );

    let assigned = 0;

    for (const reviewer of candidates) {
      if (assigned >= needed) break;

      const pairKey =
        `${target.submissionId}_${reviewer.studentId}`;

      if (existingPairs.has(pairKey)) continue;

      try {
        await ReviewAssignment.create({
          assignment: assignmentId,
          submission: target.submissionId,
          reviewer: reviewer.studentId,
          status: "PENDING",
        });

        existingPairs.add(pairKey);
        workload.set(
          reviewer.studentId,
          (workload.get(reviewer.studentId) || 0) + 1
        );

        assigned++;
        newReviewsAllocated++;
      } catch (error) {
        // Avoid hiding database errors other than duplicate-key conflicts.
        if (error.code !== 11000) throw error;
        existingPairs.add(pairKey);
      }
    }

    if (assigned < needed) {
      throw new Error(
        "Could not allocate two reviews for every submission. Check student submissions and existing review assignments."
      );
    }
  }

  const totalReviewAssignments = await ReviewAssignment.countDocuments({
    assignment: assignmentId,
  });

  return {
    submissionsCount: submissions.length,
    newReviewsAllocated,
    totalReviewAssignments,
  };
}

module.exports = { allocateReviews };
