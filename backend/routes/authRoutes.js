const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

// Example role-protected endpoint
router.get(
  "/admin-test",
  protect,
  authorize("ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome, Admin!" });
  }
);

module.exports = router;