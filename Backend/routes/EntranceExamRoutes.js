const express = require("express");
const router = express.Router();

const {
  createEntranceExam,
  getEntranceExams,
} = require("../controllers/EntranceExamController");

// Create Entrance Exam
router.post("/Create-Entrance-Exam", createEntranceExam);

// Get All Entrance Exams
router.get("/Get-All-Entrance-Exams", getEntranceExams);

module.exports = router;