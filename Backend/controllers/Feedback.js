
const Feedback = require("../models/Feedback");
const CounsellingSession = require("../models/CounsellingSession");

// CREATE FEEDBACK
const CreateFeedback = async (req, res) => {
  try {
    const { counsellingSession, rating, feedback } = req.body;

    if (!counsellingSession || !rating) {
      return res.status(400).json({
        status: false,
        message: "Please provide the counselling session ID and rating.",
      });
    }

    if (req.user.role !== "Student") {
      return res.status(403).json({
        status: false,
        message: "Only students are authorized to submit feedback.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: false,
        message: "The rating must be between 1 and 5.",
      });
    }

    const session = await CounsellingSession.findById(counsellingSession);

    if (!session) {
      return res.status(404).json({
        status: false,
        message: "The requested counselling session could not be found.",
      });
    }

    if (session.status !== "completed") {
      return res.status(400).json({
        status: false,
        message: "Feedback can only be submitted after the counselling session has been completed.",
      });
    }

    if (session.student.toString() !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to submit feedback for another student's counselling session.",
      });
    }

    const existingFeedback = await Feedback.findOne({
      counsellingSession,
    });

    if (existingFeedback) {
      return res.status(409).json({
        status: false,
        message: "Feedback has already been submitted for this counselling session.",
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
      message: "Your feedback has been submitted successfully.",
      data: newFeedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Feedback has already been submitted for this counselling session.",
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
        message: "You are not authorized to access feedback records.",
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
        message: "The requested feedback record could not be found.",
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
        message: "You are not authorized to access this feedback record.",
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
        message: "The requested feedback record could not be found.",
      });
    }

    if (
      data.student.toString() !== req.user.userId &&
      req.user.role !== "Admin" &&
      req.user.role !== "SuperAdmin"
    ) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to update this feedback record.",
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          status: false,
          message: "The rating must be between 1 and 5.",
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
      message: "The feedback has been updated successfully.",
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
        message: "Only Admin and SuperAdmin users are authorized to delete feedback.",
      });
    }

    const data = await Feedback.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "The requested feedback record could not be found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The feedback has been deleted successfully.",
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
