
const mongoose = require("mongoose");
const CounsellingSession = require("../models/CounsellingSession");
const Appointment = require("../models/Appointment");

const createCounsellingSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const { appointmentId, type, mode } = req.body;

    //1. Validate appointment id
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        status: false,
        message: "The provided appointment ID is invalid.",
      });
    }

    //2. Find appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        status: false,
        message: "The requested appointment could not be found.",
      });
    }

    // 3. check role permission
    if (role === "Student") {
      return res.status(403).json({
        status: false,
        message: "Students are not authorized to create counselling sessions.",
      });
    }

    if (
      role === "Counsellor" &&
      appointment.counsellor.toString() !== userId
    ) {
      return res.status(403).json({
        status: false,
        message: "You can create sessions only for appointments assigned to you.",
      });
    }

    if (!["Admin", "SuperAdmin", "Counsellor"].includes(role)) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to create counselling sessions.",
      });
    }

    //4. check appoinment status
    if (!["confirmed", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        status: false,
        message: "The appointment must be confirmed or completed before creating a counselling session.",
      });
    }

    //5. check duplicate session for appointment
    const existingSession = await CounsellingSession.findOne({
      appointment: appointment._id,
    });

    if (existingSession) {
      return res.status(409).json({
        status: false,
        message: "A counselling session already exists for this appointment.",
      });
    }

    const allowedTypes = ["initial", "follow_up", "admission_guidance", "other"];
    const allowedModes = ["phone", "video", "in_person", "chat"];

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid counselling session type.",
      });
    }

    if (mode && !allowedModes.includes(mode)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid counselling session mode.",
      });
    }

    // 6. Generate session number
    const lastSession = await CounsellingSession.findOne({
      counsellingRequest: appointment.counsellingRequest,
    }).sort({ sessionNumber: -1 });

    const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

    //7. create counselling session
    const session = await CounsellingSession.create({
      counsellingRequest: appointment.counsellingRequest,
      appointment: appointment._id,
      student: appointment.student,
      counsellor: appointment.counsellor,
      sessionNumber,
      type: type || "initial",
      mode: mode || appointment.mode,
      status: "in_progress",
    });

    return res.status(201).json({
      status: true,
      message: "The counselling session has been created successfully.",
      session,
    });
  } catch (error) {
    console.log("create counselling session error", error);
    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred. Please try again later.",
      error: error.message,
    });
  }
};

const GetAllCounsellingSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let filter = {};

    if (role === "Counsellor") filter.counsellor = userId;
    else if (role === "Student") filter.student = userId;
    else if (!["Admin", "SuperAdmin"].includes(role)) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to access counselling sessions.",
      });
    }

    const sessions = await CounsellingSession.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: true,
      message: "Counselling sessions have been retrieved successfully.",
      totalSessions: sessions.length,
      sessions,
    });
  } catch (error) {
    console.log("Get all counselling sessions error :", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred. Please try again later.",
      error: error.message,
    });
  }
};

const GetSingleCounsellingSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const { sessionId } = req.params;
    console.log("sessionId :", sessionId);

    //1. Validate session ID
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        status: false,
        message: "The provided counselling session ID is invalid.",
      });
    }

    //2. Find session
    const session = await CounsellingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        status: false,
        message: "The requested counselling session could not be found.",
      });
    }

    //3. check authorization
    if (
      role === "Counsellor" &&
      session.counsellor.toString() !== userId
    ) {
      return res.status(403).json({
        status: false,
        message: "You are authorized to view only your assigned counselling sessions.",
      });
    }

    if (role === "Student" && session.student.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "You are authorized to view only your own counselling sessions.",
      });
    }

    if (!["Admin", "SuperAdmin", "Counsellor", "Student"].includes(role)) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to access this counselling session.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The counselling session has been retrieved successfully.",
      session,
    });
  } catch (error) {
    console.log("Get single counselling session error:", error);
    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred. Please try again later.",
      error: error.message,
    });
  }
};

const StartCounsellingSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const { sessionId } = req.params;

    //1. validate session ID
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        status: false,
        message: "The provided counselling session ID is invalid.",
      });
    }

    //2. Find session
    const session = await CounsellingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        status: false,
        message: "The requested counselling session could not be found.",
      });
    }

    //3. check role permission
    if (role === "Student") {
      return res.status(403).json({
        status: false,
        message: "Students are not authorized to start counselling sessions.",
      });
    }

    if (
      role === "Counsellor" &&
      session.counsellor.toString() !== userId
    ) {
      return res.status(403).json({
        status: false,
        message: "You can start only counselling sessions assigned to you.",
      });
    }

    if (!["Admin", "SuperAdmin", "Counsellor"].includes(role)) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to start this counselling session.",
      });
    }

    //4. Check sessions status
    if (session.status != "in_progress") {
      return res.status(400).json({
        status: false,
        message: "Only counselling sessions with an in-progress status can be started.",
      });
    }

    //5. check already started
    if (session.startedAt) {
      return res.status(400).json({
        status: false,
        message: "This counselling session has already been started.",
      });
    }

    //6. start session
    session.startedAt = new Date();
    await session.save();

    return res.status(200).json({
      status: true,
      message: "The counselling session has been started successfully.",
      session,
    });
  } catch (error) {
    console.log("Start counselling session error :", error);
    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred. Please try again later.",
      error: error.message,
    });
  }
};

const CompleteCounsellingSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    console.log("Logged-in User ID:", userId);
    console.log("Logged-in User Role:", role);

    const { sessionId } = req.params;
    const { outcome } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        status: false,
        message: "The provided counselling session ID is invalid.",
      });
    }

    const session = await CounsellingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        status: false,
        message: "The requested counselling session could not be found.",
      });
    }

    if (role !== "Counsellor") {
      return res.status(403).json({
        status: false,
        message: "Only counsellors are authorized to complete counselling sessions.",
      });
    }

    if (!session.counsellor.equals(userId)) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to complete this counselling session.",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        status: false,
        message: "This counselling session has already been completed.",
      });
    }

    if (!session.startedAt) {
      return res.status(400).json({
        status: false,
        message: "The counselling session must be started before it can be completed.",
      });
    }

    const allowedOutcomes = [
      "counselling_completed",
      "follow_up_required",
      "recommendations_needed",
      "student_unreachable",
      "student_not_interested",
    ];

    if (!outcome || !allowedOutcomes.includes(outcome)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid counselling session outcome.",
      });
    }

    const endedAt = new Date();
    const durationMinutes = Math.floor((endedAt - session.startedAt) / 60000);

    session.endedAt = endedAt;
    session.durationMinutes = durationMinutes;
    session.outcome = outcome;
    session.status = "completed";

    await session.save();

    return res.status(200).json({
      status: true,
      message: "The counselling session has been completed successfully.",
      session,
    });
  } catch (error) {
    console.log("Complete counselling session error:", error);
    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred. Please try again later.",
      error: error.message,
    });
  }
};

module.exports = {
  createCounsellingSession,
  GetAllCounsellingSession,
  GetSingleCounsellingSession,
  StartCounsellingSession,
  CompleteCounsellingSession,
};
