
const CounsellingRequest = require("../models/CounsellingRequest");
const User = require("../models/User");
const crypto = require("crypto");
const CounsellingAssignment = require("../models/CounsellingAssignment");

// CREATE COUNSELLING REQUEST
async function CounsellingRequestController(req, res) {
  try {
    const requestNumber = `CR-${Date.now().toString().slice(-6)}`;

    console.log("Request Number:", requestNumber);

    const studentId = req.user.userId;

    console.log("Student ID:", studentId);

    const newRequest = new CounsellingRequest({
      ...req.body,
      requestNumber,
      student: studentId,
    });

    const saveRequest = await newRequest.save();

    console.log("Saved Request:", saveRequest);

    return res.status(201).json({
      success: true,
      message: "The counselling request has been created successfully.",
      data: saveRequest,
    });
  } catch (error) {
    console.log("Counselling Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the counselling request. Please try again later.",
      error: error.message,
    });
  }
}

// GET COUNSELLING REQUEST
async function GetCounsellingRequestController(req, res) {
  try {
    const studentId = req.user.userId;
    const role = req.user.role;

    console.log("Logged in User ID:", studentId);
    console.log("Logged in Role:", role);

    console.log("Student ID:", studentId);
    console.log("Role:", role);

    let requests;

    if (role === "Student") {
      requests = await CounsellingRequest.find({
        student: studentId,
      })
        .populate("student", "name email")
        .populate("assignedTo", "name email");
    } else if (role === "Counsellor") {
      console.log("Counsellor ID:", studentId);
      requests = await CounsellingRequest.find({
        assignedTo: studentId,
      })
        .populate("student", "name email")
        .populate("assignedTo", "name email");
    } else if (role === "Admin" || role === "SuperAdmin") {
      requests = await CounsellingRequest.find()
        .populate("student", "name email")
        .populate("assignedTo", "name email");
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access counselling requests.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Counselling requests have been retrieved successfully.",
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    console.log("Get Counselling Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve counselling requests. Please try again later.",
      error: error.message,
    });
  }
}

// GET SINGLE COUNSELLING REQUEST
async function GetSingleCounsellingRequestController(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { requestId } = req.params;

    const request = await CounsellingRequest.findById(requestId)
      .populate("student", "name email")
      .populate("assignedTo", "name email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "The requested counselling request could not be found.",
      });
    }

    // Student can only view their own request
    if (
      role === "Student" &&
      request.student?._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are authorized to view only your own counselling requests.",
      });
    }

    // Counsellor can only view assigned requests
    if (
      role === "Counsellor" &&
      request.assignedTo?._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are authorized to view only counselling requests assigned to you.",
      });
    }

    if (
      role !== "Student" &&
      role !== "Counsellor" &&
      role !== "Admin" &&
      role !== "SuperAdmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this counselling request.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "The counselling request has been retrieved successfully.",
      data: request,
    });

  } catch (error) {
    console.log("Get Single Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the counselling request. Please try again later.",
      error: error.message,
    });
  }
}

// ASSIGN COUNSELLING REQUEST
async function AssigendToController(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    console.log("Logged in User Role:", role);

    if (role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin or SuperAdmin users are authorized to assign counselling requests.",
      });
    }

    console.log("Request Body:", req.body);

    const { requestId, counsellorId } = req.body;

    if (!requestId || !counsellorId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both the counselling request ID and counsellor ID.",
      });
    }

    console.log("Request ID:", requestId);
    console.log("Counsellor ID:", counsellorId);

    // Find counselling request
    const request = await CounsellingRequest.findById(requestId);

    console.log("Found Request:", request);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "The requested counselling request could not be found.",
      });
    }

    // Find counsellor
    const Counseller = await User.findById(counsellorId).populate(
      "role",
      "role",
    );

    if (!Counseller) {
      return res.status(404).json({
        success: false,
        message: "The selected counsellor could not be found.",
      });
    }

    if (!Counseller.role || Counseller.role.role !== "Counsellor") {
      return res.status(400).json({
        success: false,
        message: "The selected user does not have the Counsellor role.",
      });
    }

    console.log("Found Counsellor:", Counseller);

    // Check existing active assignment
    const existingAssignment = await CounsellingAssignment.findOne({
      counsellingRequest: requestId,
      status: "active",
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "This counselling request is already assigned. Please use the reassignment API.",
      });
    }

    // Assign counsellor
    request.assignedTo = counsellorId;

    //Add status history
    if (request.status !== "assigned") {
      request.statusHistory.push({
        oldStatus: request.status,
        newStatus: "assigned",
        updatedBy: userId,
        updatedAt: new Date(),
      });
    }

    request.status = "assigned";
    await request.save();

    // Create assignment history record
    const assignment = await CounsellingAssignment.create({
      counsellingRequest: request._id,
      counsellor: counsellorId,
      assignedBy: userId,
      assignmentType: "manual",
      status: "active",
    });

    console.log("Updated Request:", request);

    return res.status(200).json({
      success: true,
      message: "The counselling request has been assigned successfully.",
      data: request,
      assignment
    });
  } catch (error) {
    console.log("Assign Counselling Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to assign the counselling request. Please try again later.",
      error: error.message,
    });
  }
}

async function UpdateCounsellingRequestStatus(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    console.log("userID>>>>", userId);
    console.log("role>>>>>>>", role);

    const { requestId, status } = req.body;

    const allowedStatus = [
      "new",
      "assigned",
      "contact_pending",
      "in_progress",
      "recommendations_shared",
      "converted",
      "closed",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid counselling request status.",
      });
    }

    //Find Request
    const request = await CounsellingRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "The requested counselling request could not be found.",
      });
    }

    // Check authorized user
    if (role === "Counsellor" && request.assignedTo?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are authorized to update only counselling requests assigned to you.",
      });
    }

    if (role !== "Counsellor" && role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update the counselling request status.",
      });
    }

    //Update status
    if (request.status === status) {
      return res.status(200).json({
        success: true,
        message: "The counselling request status is already set to " + status + ".",
        data: request,
      });
    }

    request.statusHistory.push({
      oldStatus: request.status,
      newStatus: status,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    request.status = status;

    await request.save();

    return res.status(200).json({
      success: true,
      message: "The counselling request status has been updated successfully.",
      data: request,
    });
  } catch (error) {
    console.log("Update Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the counselling request status. Please try again later.",
      error: error.message,
    });
  }
}

module.exports = {
  CounsellingRequestController,
  GetCounsellingRequestController,
  AssigendToController,
  UpdateCounsellingRequestStatus,
  GetSingleCounsellingRequestController
};
