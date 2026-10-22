
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const {
  getAdminStats,
  getUsers,
  updateUserStatus,
  updateUserRole
} = require("../controllers/adminController");

router.use(protect, authorize("ADMIN"));

router.get("/stats", getAdminStats);
router.get("/users", getUsers);
router.patch("/users/:userId/status", updateUserStatus);
router.patch("/users/:userId/role", updateUserRole);

module.exports = router;
