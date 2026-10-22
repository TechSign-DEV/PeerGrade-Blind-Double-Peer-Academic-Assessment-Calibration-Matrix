
const mongoose = require("mongoose");

const rubricScoreSchema = new mongoose.Schema(
  {
    criterionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    criterion: {
      type: String,
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    feedback: {
      type: String,
      default: "",
      maxlength: 2000,
    },
  },
  { _id: false }
);

const reviewAssignmentSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },

    rubricScores: {
      type: [rubricScoreSchema],
      default: [],
    },

    overallFeedback: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

reviewAssignmentSchema.index(
  { assignment: 1, submission: 1, reviewer: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ReviewAssignment",
  reviewAssignmentSchema
);
