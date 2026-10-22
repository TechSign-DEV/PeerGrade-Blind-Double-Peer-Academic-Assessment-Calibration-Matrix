
const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },

    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    calculatedMarks: {
      type: Number,
      required: true,
      min: 0
    },

    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },

    peerReviewCount: {
      type: Number,
      required: true,
      min: 2
    },

    calculationMethod: {
      type: String,
      default: "AVERAGE_OF_COMPLETED_PEER_REVIEWS"
    },

    instructorFeedback: {
      type: String,
      default: "",
      maxlength: 5000
    },

    status: {
      type: String,
      enum: ["DRAFT", "RELEASED"],
      default: "DRAFT",
      index: true
    },

    releasedAt: {
      type: Date,
      default: null
    },

    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

gradeSchema.index(
  { assignment: 1, submission: 1 },
  { unique: true }
);

module.exports = mongoose.model("Grade", gradeSchema);
