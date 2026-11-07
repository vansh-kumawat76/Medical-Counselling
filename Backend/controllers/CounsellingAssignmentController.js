
const CounsellingAssignment = require("../models/CounsellingAssignment");

// GET ALL COUNSELLING ASSIGNMENTS
async function GetAllAssignmentsController(req, res) {
  try {
    const role = req.user.role;

    if (role !== "Admin" && role !== "SuperAdmin" && role !== "Counsellor") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view assignments",
      });
    }

    let filter = {};

    // Counsellor can only see their own assignments
    if (role === "Counsellor") {
      filter.counsellor = req.user.userId;
    }

    const assignments = await CounsellingAssignment.find(filter)
      .populate({
        path: "counsellingRequest",
        populate: {
          path: "student",
          select: "name email",
        },
      })
      .populate("counsellor", "name email")
      .populate("assignedBy", "name email")
      .populate("reassignedTo", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Counselling assignments fetched successfully",
      total: assignments.length,
      data: assignments,
    });

  } catch (error) {
    console.log("Get All Assignments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch counselling assignments",
      error: error.message,
    });
  }
}


// GET SINGLE COUNSELLING ASSIGNMENT
async function GetSingleAssignmentController(req, res) {
  try {
    const { id } = req.params;
    const role = req.user.role;

    if (
      role !== "Admin" &&
      role !== "SuperAdmin" &&
      role !== "Counsellor"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this assignment",
      });
    }

    const assignment = await CounsellingAssignment.findById(id)
      .populate({
        path: "counsellingRequest",
        populate: {
          path: "student",
          select: "name email",
        },
      })
      .populate("counsellor", "name email")
      .populate("assignedBy", "name email")
      .populate("reassignedTo", "name email");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Counselling assignment not found",
      });
    }

    if (
      role === "Counsellor" &&
      assignment.counsellor?._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own assignments",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Counselling assignment fetched successfully",
      data: assignment,
    });

  } catch (error) {
    console.log("Get Single Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch counselling assignment",
      error: error.message,
    });
  }
}


const User = require("../models/User");
const CounsellingRequest = require("../models/CounsellingRequest");

// REASSIGN COUNSELLING REQUEST
async function ReassignCounsellingController(req, res) {
  try {
    const role = req.user.role;

    if (role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin or SuperAdmin can reassign requests",
      });
    }

    const { assignmentId, counsellorId, reassignmentReason } = req.body;

    if (!assignmentId || !counsellorId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID and counsellor ID are required",
      });
    }

    const assignment = await CounsellingAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active assignments can be reassigned",
      });
    }

    if (assignment.counsellor.toString() === counsellorId) {
      return res.status(400).json({
        success: false,
        message: "This counsellor is already assigned",
      });
    }

    const newCounsellor = await User.findById(counsellorId).populate(
      "role",
      "role"
    );

    if (!newCounsellor || newCounsellor.role?.role !== "Counsellor") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a counsellor",
      });
    }

    const request = await CounsellingRequest.findById(
      assignment.counsellingRequest
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Counselling request not found",
      });
    }

    // Update old assignment
    assignment.status = "reassigned";
    assignment.reassignedTo = counsellorId;
    assignment.reassignmentReason = reassignmentReason || "";
    assignment.endedAt = new Date();

    await assignment.save();

    // Create new assignment
    const newAssignment = await CounsellingAssignment.create({
      counsellingRequest: request._id,
      counsellor: counsellorId,
      assignedBy: req.user.userId,
      assignmentType: "manual",
      status: "active",
    });

    // Update current counsellor in request
    request.assignedTo = counsellorId;

    if (request.status !== "assigned") {
      request.statusHistory.push({
        oldStatus: request.status,
        newStatus: "assigned",
        updatedBy: req.user.userId,
        updatedAt: new Date(),
      });
    }

    request.status = "assigned";

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Counselling request reassigned successfully",
      data: newAssignment,
    });

  } catch (error) {
    console.log("Reassign Counselling Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reassign counselling request",
      error: error.message,
    });
  }
}


module.exports = {
  GetAllAssignmentsController,
  GetSingleAssignmentController,
  ReassignCounsellingController
};
