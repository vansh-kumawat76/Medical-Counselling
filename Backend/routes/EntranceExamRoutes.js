const express = require("express");
const router = express.Router();

const {
  createEntranceExam,
  getEntranceExams,
} = require("../controllers/EntranceExamController");

const cacheMiddleware = require("../middleware/cacheMiddleware");

// Create Entrance Exam
router.post("/Create-Entrance-Exam", createEntranceExam);

// Get All Entrance Exams
router.get("/Get-All-Entrance-Exams",
  cacheMiddleware(300),
   getEntranceExams);

module.exports = router;