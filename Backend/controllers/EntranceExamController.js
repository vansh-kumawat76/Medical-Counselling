
const EntranceExam = require("../models/EntranceExam");

// Create Entrance Exam
async function createEntranceExam(req, res) {
  try {
    const { name, fullName, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: "Please provide the entrance exam name.",
      });
    }

    const existingExam = await EntranceExam.findOne({
      name: name.trim(),
    });

    if (existingExam) {
      return res.status(409).json({
        status: false,
        message: "An entrance exam with this name already exists.",
      });
    }

    const exam = await EntranceExam.create({
      name: name.trim(),
      fullName,
      description,
    });

    return res.status(201).json({
      status: true,
      message: "The entrance exam has been created successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred while creating the entrance exam.",
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
      message: "Active entrance exams have been retrieved successfully.",
      data: exams,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred while retrieving entrance exams.",
      error: error.message,
    });
  }
}

module.exports = {
  createEntranceExam,
  getEntranceExams,
};
