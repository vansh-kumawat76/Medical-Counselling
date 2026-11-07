
const FollowUp = require("../models/FollowUp");
const CounsellingRequest = require("../models/CounsellingRequest");

const allowedRoles = ["SuperAdmin", "Admin", "Counsellor"];

const CreateFollowUp = async (req, res) => {
  try {
    const {
      counsellingRequest,
      assignedTo,
      title,
      description,
      dueAt,
      type,
    } = req.body;

    if (
      !counsellingRequest ||
      !assignedTo ||
      !title ||
      !dueAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const request = await CounsellingRequest.findById(counsellingRequest);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Counselling request not found",
      });
    }

    const followUp = await FollowUp.create({
      counsellingRequest,
      student: request.student,
      assignedTo,
      createdBy: req.user.userId,
      title,
      description,
      dueAt,
      type,
    });

    return res.status(201).json({
      success: true,
      message: "Follow-up created successfully",
      data: followUp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const GetAllFollowUps = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "Counsellor") {
      filter.assignedTo = req.user.userId;
    } else if (req.user.role === "Student") {
      filter.student = req.user.userId;
    } else if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Pending follow-ups whose due date has passed are returned as overdue.
    await FollowUp.updateMany(
      {
        ...filter,
        status: "pending",
        dueAt: { $lt: new Date() },
      },
      { $set: { status: "overdue" } }
    );

    const followUps = await FollowUp.find(filter)
      .populate("student", "name email")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("counsellingRequest")
      .sort({ dueAt: 1 });

    return res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const GetSingleFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id)
      .populate("student", "name email")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("counsellingRequest");

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    const userId = req.user.userId.toString();

    if (
      req.user.role === "Counsellor" &&
      followUp.assignedTo._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      req.user.role === "Student" &&
      followUp.student._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== "Student") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const UpdateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    const isAdmin = ["Admin", "SuperAdmin"].includes(req.user.role);
    const isAssignedCounsellor =
      req.user.role === "Counsellor" &&
      followUp.assignedTo.toString() === req.user.userId.toString();

    if (!isAdmin && !isAssignedCounsellor) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this follow-up",
      });
    }

    const allowedFields = [
      "assignedTo",
      "title",
      "description",
      "dueAt",
      "type",
      "status",
      "outcome",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        followUp[field] = req.body[field];
      }
    });

    if (followUp.status === "completed") {
      followUp.completedAt = new Date();
    } else if (followUp.status !== "completed") {
      followUp.completedAt = undefined;
    }

    await followUp.save();

    return res.status(200).json({
      success: true,
      message: "Follow-up updated successfully",
      data: followUp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const DeleteFollowUp = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can delete follow-ups",
      });
    }

    const followUp = await FollowUp.findByIdAndDelete(req.params.id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  CreateFollowUp,
  GetAllFollowUps,
  GetSingleFollowUp,
  UpdateFollowUp,
  DeleteFollowUp,
};
