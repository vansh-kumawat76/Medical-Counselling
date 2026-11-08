const express = require("express");
const {
  updateStudentProfile,
  getStudentProfile,
  uploadStudentProfileImage,
  uploadStudentCoverImage,
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

module.exports = router;