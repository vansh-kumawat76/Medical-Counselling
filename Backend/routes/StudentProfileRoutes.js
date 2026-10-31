const express = require("express");
const {
  updateStudentProfile,
  getStudentProfile,
  uploadStudentProfileImage,
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

module.exports = router;