const express = require("express");
const router = express.Router();

const {loginUser, dashboard, forgetPassword, verifyForgetOtp, resetPassword, logoutUser} = require("../controllers/AuthController");
const auth = require("../auth");
router.post("/login-user", loginUser);
router.get("/dashboard",auth,dashboard)
router.post("/forget-password", forgetPassword);
router.post("/verify-forget-otp", verifyForgetOtp);
router.post("/reset-password", resetPassword);
router.post("/logout", logoutUser)
module.exports = router;