
const express = require("express");
const router = express.Router();

const { generateOtp, verifyOtp } = require("../controllers/OtpController");

router.post("/otp-generate", generateOtp);
router.post("/verify-otp", verifyOtp);
module.exports = router;
