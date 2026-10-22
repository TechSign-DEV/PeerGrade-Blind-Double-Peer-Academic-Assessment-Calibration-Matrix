
const mongoose = require("mongoose");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const ReviewAssignment = require("../models/ReviewAssignment");
const Grade = require("../models/Grade");

// Admin: platform overview statistics.
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      students,
      instructors,
      admins,
      activeUsers,
      inactiveUsers,
      totalAssignments,
      totalSubmissions,
      completedReviews,
      releasedGrades
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "INSTRUCTOR" }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      ReviewAssignment.countDocuments({ status: "COMPLETED" }),
      Grade.countDocuments({ status: "RELEASED" })
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        students,
        instructors,
        admins,
        active: activeUsers,
        inactive: inactiveUsers
      },
      platform: {
        assignments: totalAssignments,
        submissions: totalSubmissions,
        completedPeerReviews: completedReviews,
        releasedGrades
      }
    });
  } catch (error) {
    console.error("Admin statistics error:", error.message);

    return res.status(500).json({
      message: "Could not load platform statistics."
    });
  }
};

// Admin: list users with optional role and search filters.
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    const filter = {};

    if (role && role !== "ALL") {
      if (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role filter."
        });
      }

      filter.role = role;
    }

    if (search && typeof search === "string") {
      const term = search.trim().slice(0, 100);

      if (term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        filter.$or = [
          { name: regex },
          { email: regex }
        ];
      }
    }

    const users = await User.find(filter)
      .select("_id name email role isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      users,
      count: users.length,
      limit: 200
    });
  } catch (error) {
    console.error("Admin user list error:", error.message);

    return res.status(500).json({
      message: "Could not load users."
    });
  }
};

// Admin: activate or deactivate an account.
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false."
      });
    }

    if (String(req.user._id) === String(userId) && !isActive) {
      return res.status(400).json({
        message: "You cannot deactivate your own account."
      });
    }

    const target = await User.findById(userId);

    if (!target) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // Prevent removing the last active administrator.
    if (
      !isActive &&
      target.role === "ADMIN" &&
      target.isActive
    ) {
      const activeAdmins = await User.countDocuments({
        role: "ADMIN",
        isActive: true
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          message: "The last active administrator cannot be deactivated."
        });
      }
    }

    target.isActive = isActive;
    await target.save();

    return res.status(200).json({
      message: isActive
        ? "User account activated."
        : "User account deactivated.",
      user: {
        id: String(target._id),
        name: target.name,
        email: target.email,
        role: target.role,
        isActive: target.isActive
      }
    });
  } catch (error) {
    console.error("Update user status error:", error.message);

    return res.status(500).json({
      message: "Could not update the user account."
    });
  }
};

// Admin: change a user's role.
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    if (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
      return res.status(400).json({
        message: "Choose a valid role."
      });
    }

    const target = await User.findById(userId);

    if (!target) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const isSelf = String(req.user._id) === String(userId);

    if (isSelf && role !== "ADMIN") {
      return res.status(400).json({
        message: "You cannot change your own administrator role."
      });
    }

    if (
      target.role === "ADMIN" &&
      target.isActive &&
      role !== "ADMIN"
    ) {
      const activeAdmins = await User.countDocuments({
        role: "ADMIN",
        isActive: true
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          message: "The last active administrator cannot lose the admin role."
        });
      }
    }

    target.role = role;
    await target.save();

    return res.status(200).json({
      message: "User role updated.",
      user: {
        id: String(target._id),
        name: target.name,
        email: target.email,
        role: target.role,
        isActive: target.isActive
      }
    });
  } catch (error) {
    console.error("Update user role error:", error.message);

    return res.status(500).json({
      message: "Could not update the user role."
    });
  }
};
