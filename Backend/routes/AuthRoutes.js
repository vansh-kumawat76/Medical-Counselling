const express = require("express");
const router = express.Router();

const {
  loginUser,
  dashboard,
  forgetPassword,
  verifyForgetOtp,
  resetPassword,
  logoutUser,
  changePassword,
} = require("../controllers/AuthController");

const auth = require("../auth");

const {
  loginLimiter,
  forgotPasswordLimiter,
  otpLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
  generalLimiter,
} = require("../middleware/rateLimiter");

// Login: 5 requests / 15 minutes
router.post("/login-user", loginLimiter, loginUser);

router.get("/dashboard", auth, generalLimiter, dashboard);

// Forgot Password: 3 requests / 15 minutes
router.post("/forget-password", forgotPasswordLimiter, forgetPassword);

// OTP Verification: 5 requests / 10 minutes
router.post("/verify-forget-otp", otpLimiter, verifyForgetOtp);

router.post("/reset-password", resetPasswordLimiter, resetPassword);

router.post("/change-password", auth, changePasswordLimiter, changePassword);

router.post("/logout", generalLimiter, logoutUser);

module.exports = router;