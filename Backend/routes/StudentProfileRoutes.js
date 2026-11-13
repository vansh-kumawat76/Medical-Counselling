
const express = require("express");

const {
  updateStudentProfile,
  getStudentProfile,
  uploadStudentProfileImage,
  uploadStudentCoverImage,
  deactivateStudentAccount,
  getActiveSessions,
  terminateSession,
  logoutOtherSessions,
  getAccountSecurity,
} = require("../controllers/StudentProfileController");

const router = express.Router();
const auth = require("../auth");
const upload = require("../middleware/upload");

router.put("/Edit-studentProfile", auth, updateStudentProfile);

router.get("/Get-studentProfile", auth, getStudentProfile);

router.post(
  "/Upload-profileImage",
  auth,
  upload.single("profileImage"),
  uploadStudentProfileImage
);

router.post(
  "/Upload-coverImage",
  auth,
  upload.single("coverImage"),
  uploadStudentCoverImage
);

// Deactivate Student Account
router.post(
  "/deactivate-account",
  auth,
  deactivateStudentAccount
);

// Active Sessions Management
router.get("/active-sessions", auth, getActiveSessions);

router.delete(
  "/active-sessions/:sessionId",
  auth,
  terminateSession
);

router.post(
  "/active-sessions/logout-others",
  auth,
  logoutOtherSessions
);

// Account Security Information
router.get(
  "/account-security",
  auth,
  getAccountSecurity
);

module.exports = router;
