
const express = require("express");
const router = express.Router();

const { createUser, verifyEmail } = require("../controllers/UserController");

router.post("/create-user", createUser);
router.post("/verify-email", verifyEmail);

module.exports = router;
