
const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../auth");

const {
  UploadBackgroundVideo,
  GetActiveBackgroundVideo,
} = require("../controllers/BackgroundVideoController");

// Multer memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

// Admin video upload
router.post(
  "/upload",
  auth,
  upload.single("video"),
  UploadBackgroundVideo
);

// Frontend active video fetch
router.get("/active", GetActiveBackgroundVideo);

module.exports = router;
