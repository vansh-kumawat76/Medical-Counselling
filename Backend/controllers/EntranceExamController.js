const EntranceExam = require("../models/EntranceExam");

// Create Entrance Exam
async function createEntranceExam(req, res) {
  try {
    const { name, fullName, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: "Exam name is required",
      });
    }

    const existingExam = await EntranceExam.findOne({
      name: name.trim(),
    });

    if (existingExam) {
      return res.status(409).json({
        status: false,
        message: "Entrance exam already exists",
      });
    }

    const exam = await EntranceExam.create({
      name: name.trim(),
      fullName,
      description,
    });

    return res.status(201).json({
      status: true,
      message: "Entrance exam created successfully",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// Get All Active Entrance Exams
async function getEntranceExams(req, res) {
  try {
    const exams = await EntranceExam.find({
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      status: true,
      message: "Entrance exams fetched successfully",
      data: exams,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = {
  createEntranceExam,
  getEntranceExams,
};