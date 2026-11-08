
const Feedback = require("../models/Feedback");
const CounsellingSession = require("../models/CounsellingSession");

// CREATE FEEDBACK
const CreateFeedback = async (req, res) => {
  try {
    const { counsellingSession, rating, feedback } = req.body;

    if (!counsellingSession || !rating) {
      return res.status(400).json({
        status: false,
        message: "Counselling session and rating are required",
      });
    }

    if (req.user.role !== "Student") {
      return res.status(403).json({
        status: false,
        message: "Only students can submit feedback",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const session = await CounsellingSession.findById(counsellingSession);

    if (!session) {
      return res.status(404).json({
        status: false,
        message: "Counselling session not found",
      });
    }

    if (session.status !== "completed") {
      return res.status(400).json({
        status: false,
        message: "Feedback can only be submitted after session completion",
      });
    }

    if (session.student.toString() !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "You cannot submit feedback for another student's session",
      });
    }

    const existingFeedback = await Feedback.findOne({
      counsellingSession,
    });

    if (existingFeedback) {
      return res.status(409).json({
        status: false,
        message: "Feedback already submitted for this session",
      });
    }

    const newFeedback = await Feedback.create({
      counsellingSession,
      student: session.student,
      counsellor: session.counsellor,
      rating,
      feedback,
    });

    return res.status(201).json({
      status: true,
      message: "Feedback submitted successfully",
      data: newFeedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Feedback already submitted for this session",
      });
    }

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// GET ALL FEEDBACK
const GetAllFeedback = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "Student") {
      filter.student = req.user.userId;
    } else if (req.user.role === "Counsellor") {
      filter.counsellor = req.user.userId;
    } else if (
      req.user.role !== "Admin" &&
      req.user.role !== "SuperAdmin"
    ) {
      return res.status(403).json({
        status: false,
        message: "Access denied",
      });
    }

    const data = await Feedback.find(filter)
      .populate("counsellingSession")
      .populate("student", "name email")
      .populate("counsellor", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// GET SINGLE FEEDBACK
const GetSingleFeedback = async (req, res) => {
  try {
    const data = await Feedback.findById(req.params.id)
      .populate("counsellingSession")
      .populate("student", "name email")
      .populate("counsellor", "name email");

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Feedback not found",
      });
    }

    const isOwner =
      data.student?._id.toString() === req.user.userId ||
      data.counsellor?._id.toString() === req.user.userId;

    const isAdmin =
      req.user.role === "Admin" ||
      req.user.role === "SuperAdmin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// UPDATE FEEDBACK
const UpdateFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const data = await Feedback.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Feedback not found",
      });
    }

    if (
      data.student.toString() !== req.user.userId &&
      req.user.role !== "Admin" &&
      req.user.role !== "SuperAdmin"
    ) {
      return res.status(403).json({
        status: false,
        message: "You are not allowed to update this feedback",
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          status: false,
          message: "Rating must be between 1 and 5",
        });
      }

      data.rating = rating;
    }

    if (feedback !== undefined) {
      data.feedback = feedback;
    }

    await data.save();

    return res.status(200).json({
      status: true,
      message: "Feedback updated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// DELETE FEEDBACK
const DeleteFeedback = async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SuperAdmin"
    ) {
      return res.status(403).json({
        status: false,
        message: "Only Admin can delete feedback",
      });
    }

    const data = await Feedback.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  CreateFeedback,
  GetAllFeedback,
  GetSingleFeedback,
  UpdateFeedback,
  DeleteFeedback,
};
