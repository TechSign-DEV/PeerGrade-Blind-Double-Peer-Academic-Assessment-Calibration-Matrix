
const Assignment = require("../models/Assignment");

// POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      courseName,
      deadline,
      maxMarks,
      rubric,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof courseName !== "string" ||
      !courseName.trim() ||
      !deadline ||
      !Number.isFinite(Number(maxMarks)) ||
      Number(maxMarks) <= 0
    ) {
      return res.status(400).json({
        message: "Please provide valid assignment details.",
      });
    }

    const deadlineDate = new Date(deadline);

    if (
      Number.isNaN(deadlineDate.getTime()) ||
      deadlineDate <= new Date()
    ) {
      return res.status(400).json({
        message: "Deadline must be a valid future date.",
      });
    }

    if (rubric !== undefined && !Array.isArray(rubric)) {
      return res.status(400).json({
        message: "Rubric must be an array.",
      });
    }

    const criteria = rubric || [];

    for (const item of criteria) {
      if (
        typeof item.criterion !== "string" ||
        !item.criterion.trim() ||
        !Number.isFinite(Number(item.maxMarks)) ||
        Number(item.maxMarks) <= 0
      ) {
        return res.status(400).json({
          message: "Each rubric criterion needs a name and positive marks.",
        });
      }
    }

    const totalRubricMarks = criteria.reduce(
      (sum, item) => sum + Number(item.maxMarks),
      0
    );

    if (
      criteria.length > 0 &&
      Math.abs(totalRubricMarks - Number(maxMarks)) > 0.001
    ) {
      return res.status(400).json({
        message: "Rubric marks must add up to the assignment maximum.",
      });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      courseName: courseName.trim(),
      deadline: deadlineDate,
      maxMarks: Number(maxMarks),
      rubric: criteria.map((item) => ({
        criterion: item.criterion.trim(),
        description: item.description || "",
        maxMarks: Number(item.maxMarks),
      })),
      instructor: req.user._id,
      status: "PUBLISHED",
    });

    return res.status(201).json({
      message: "Assignment created successfully.",
      assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error.message);

    return res.status(500).json({
      message: "Unable to create assignment.",
    });
  }
};

// GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      status: "PUBLISHED",
    })
      .select("-__v")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve assignments.",
    });
  }
};

// GET /api/assignments/mine
exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      instructor: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get instructor assignments error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your assignments.",
    });
  }
};
