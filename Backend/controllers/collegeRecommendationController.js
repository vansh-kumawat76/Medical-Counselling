
const CollegeRecommendation = require("../models/CollegeRecommendation");
const CounsellingRequest = require("../models/CounsellingRequest");
const CollegeCourse = require("../models/CollegeCourse");
const mongoose = require("mongoose");
const createCollegeRecommendation = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);
    console.log("Request body:", req.body);

    const userId = req.user.userId;
    const role = req.user.role;

    console.log("User ID:", userId);
    console.log("Role:", role);

    const { counsellingRequestId, colleges, counsellorRemarks } = req.body;

    console.log("Counselling Request ID:", counsellingRequestId);
    console.log("Recommended Colleges:", colleges);
    console.log("Counsellor Remarks:", counsellorRemarks);

    // Only Counsellor can create recommendation
    if (role !== "Counsellor") {
      return res.status(403).json({
        success: false,
        message: "Only counsellor can create college recommendations"
      });
    }

    // Validate required fields
    if (!counsellingRequestId || !Array.isArray(colleges) || colleges.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Counselling request ID and at least one college are required"
      });
    }

    // Find Counselling Request
    const findCounsellingRequest = await CounsellingRequest.findById(
      counsellingRequestId
    );

    console.log("Found Counselling Request:", findCounsellingRequest);

    if (!findCounsellingRequest) {
      return res.status(404).json({
        success: false,
        message: "Counselling request not found"
      });
    }

    // Check assigned counsellor
    if (
      !findCounsellingRequest.assignedTo ||
      findCounsellingRequest.assignedTo.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "This counselling request is not assigned to you"
      });
    }

    // Find existing recommendation
    const existingRecommendation = await CollegeRecommendation.findOne({
      counsellingRequest: counsellingRequestId
    });

    console.log("Existing Recommendation:", existingRecommendation);

    // If recommendation already exists
    if (existingRecommendation) {

      // Do not modify shared recommendation
      if (existingRecommendation.status === "shared") {
        return res.status(400).json({
          success: false,
          message: "Recommendation is already shared and cannot be modified"
        });
      }

      let addedCount = 0;

      for (const newCollege of colleges) {

        const alreadyExists = existingRecommendation.colleges.some(
          (item) =>
            item.collegeCourse.toString() ===
            newCollege.collegeCourse.toString()
        );

        if (!alreadyExists) {
          existingRecommendation.colleges.push(newCollege);
          addedCount++;
        }
      }

      if (counsellorRemarks !== undefined) {
        existingRecommendation.counsellorRemarks = counsellorRemarks;
      }

      await existingRecommendation.save();

      return res.status(200).json({
        success: true,
        message: "Existing college recommendation updated successfully",
        addedCount,
        data: existingRecommendation
      });
    }

    // Create new recommendation if not exists
    const createRecommendation = await CollegeRecommendation.create({
      counsellingRequest: counsellingRequestId,
      student: findCounsellingRequest.student,
      counsellor: userId,
      colleges: colleges,
      counsellorRemarks: counsellorRemarks,
      status: "draft"
    });

    return res.status(201).json({
      success: true,
      message: "College recommendation created successfully",
      data: createRecommendation
    });

  } catch (error) {
    console.error("Create College Recommendation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create college recommendation",
      error: error.message
    });
  }
};


const getAllCollegeRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let filter = {};

    // Counsellor can see only their own recommendations
    if (role === "Counsellor") {
      filter.counsellor = userId;
    }

    // Student can see only their own shared recommendations
    else if (role === "Student") {
      filter.student = userId;
      filter.status = "shared";
    }

    // Admin and SuperAdmin can see all recommendations
    else if (role !== "Admin" && role !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view recommendations",
      });
    }

    const recommendations = await CollegeRecommendation.find(filter)
      .populate("counsellingRequest")
      .populate({
        path: "student",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil",
      })
      .populate({
        path: "counsellor",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil",
      })
      .populate("colleges.college")
      .populate("colleges.collegeCourse")
      .populate("colleges.course")
      .populate("colleges.specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "College recommendations fetched successfully",
      count: recommendations.length,
      data: recommendations,
    });

  } catch (error) {
    console.error("Get All College Recommendations Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch college recommendations",
      error: error.message,
    });
  }
};



const getSingleCollegeRecommendation = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);

    const userId = req.user.userId;
    const role = req.user.role;

    const { id } = req.params;

    console.log("Recommendation ID:", id);

    // Find recommendation
    const recommendation = await CollegeRecommendation.findById(id)
      .populate("counsellingRequest")
      .populate({
        path: "student",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil"
      })
      .populate({
        path: "counsellor",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil"
      })
      .populate("colleges.college")
      .populate("colleges.collegeCourse")
      .populate("colleges.course")
      .populate("colleges.specialization");

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "College recommendation not found"
      });
    }

    // Role-wise access
    if (role === "Student") {

      if (recommendation.student._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this recommendation"
        });
      }

      if (recommendation.status !== "shared") {
        return res.status(403).json({
          success: false,
          message: "This recommendation has not been shared yet"
        });
      }

    } else if (role === "Counsellor") {

      if (recommendation.counsellor._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own recommendations"
        });
      }

    } else if (role !== "Admin" && role !== "SuperAdmin") {

      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this recommendation"
      });

    }

    return res.status(200).json({
      success: true,
      message: "College recommendation fetched successfully",
      data: recommendation
    });

  } catch (error) {
    console.error("Get Single College Recommendation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch college recommendation",
      error: error.message
    });
  }
};

const updateCollegeRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { colleges, counsellorRemarks } = req.body;
    const { id } = req.params;

    // Only Counsellor can update recommendation
    if (role !== "Counsellor") {
      return res.status(403).json({
        success: false,
        message: "Only counsellor can update recommendation",
      });
    }

    // Validate recommendation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recommendation ID",
      });
    }

    // Find recommendation
    const recommendation = await CollegeRecommendation.findById(id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "College recommendation not found",
      });
    }

    // Check recommendation ownership
    if (recommendation.counsellor.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this recommendation",
      });
    }

    // Shared recommendation cannot be updated
    if (recommendation.status === "shared") {
      return res.status(400).json({
        success: false,
        message: "Shared recommendation cannot be updated",
      });
    }

    // Verify counselling request assignment
    const counsellingRequest = await CounsellingRequest.findById(
      recommendation.counsellingRequest
    );

    if (!counsellingRequest) {
      return res.status(404).json({
        success: false,
        message: "Counselling request not found",
      });
    }

    if (
      !counsellingRequest.assignedTo ||
      counsellingRequest.assignedTo.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This counselling request is not assigned to you",
      });
    }

    // Check whether at least one field is provided
    if (colleges === undefined && counsellorRemarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide fields to update",
      });
    }

    // Update colleges array if provided
    if (colleges !== undefined) {
      if (!Array.isArray(colleges) || colleges.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one college recommendation is required",
        });
      }

      const seenCollegeCourses = new Set();

      for (const item of colleges) {
        if (
          !item ||
          !item.college ||
          !item.collegeCourse ||
          !item.course
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each college must contain college, collegeCourse and course IDs",
          });
        }

        // Validate ObjectIds
        if (
          !mongoose.Types.ObjectId.isValid(item.college) ||
          !mongoose.Types.ObjectId.isValid(item.collegeCourse) ||
          !mongoose.Types.ObjectId.isValid(item.course)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid college, collegeCourse or course ID",
          });
        }

        // Prevent duplicate college courses
        const collegeCourseId = item.collegeCourse.toString();

        if (seenCollegeCourses.has(collegeCourseId)) {
          return res.status(400).json({
            success: false,
            message: "Duplicate college course is not allowed",
          });
        }

        seenCollegeCourses.add(collegeCourseId);

        // Validate fees
        if (
          item.fees !== undefined &&
          (!Number.isFinite(Number(item.fees)) || Number(item.fees) < 0)
        ) {
          return res.status(400).json({
            success: false,
            message: "Fees must be a valid non-negative number",
          });
        }

        // Verify CollegeCourse exists
        const courseData = await CollegeCourse.findById(
          item.collegeCourse
        );

        if (!courseData) {
          return res.status(404).json({
            success: false,
            message: `College course not found: ${item.collegeCourse}`,
          });
        }

        // Verify selected college and course match CollegeCourse
        if (
          courseData.college.toString() !== item.college.toString() ||
          courseData.course.toString() !== item.course.toString()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "College or course does not match the selected college course",
          });
        }
      }

      // Replace complete colleges array
      recommendation.colleges = colleges;
    }

    // Update counsellor remarks if provided
    if (counsellorRemarks !== undefined) {
      if (typeof counsellorRemarks !== "string") {
        return res.status(400).json({
          success: false,
          message: "Counsellor remarks must be a string",
        });
      }

      recommendation.counsellorRemarks = counsellorRemarks.trim();
    }

    await recommendation.save();

    // Return updated recommendation with populated data
    const updatedRecommendation = await CollegeRecommendation.findById(
      recommendation._id
    )
      .populate("counsellingRequest")
      .populate({
        path: "student",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil",
      })
      .populate({
        path: "counsellor",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil",
      })
      .populate("colleges.college")
      .populate("colleges.collegeCourse")
      .populate("colleges.course")
      .populate("colleges.specialization");

    return res.status(200).json({
      success: true,
      message: "College recommendation updated successfully",
      data: updatedRecommendation,
    });
  } catch (error) {
    console.error("Update College Recommendation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Share College Recommendation
const shareCollegeRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { id } = req.params;

    // Only Counsellor can share recommendation
    if (role !== "Counsellor") {
      return res.status(403).json({
        success: false,
        message: "Only counsellor can share college recommendation",
      });
    }

    // Find recommendation
    const recommendation = await CollegeRecommendation.findById(id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "College recommendation not found",
      });
    }

    // Check recommendation ownership
    if (String(recommendation.counsellor) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to share this recommendation",
      });
    }

    // Only draft recommendation can be shared
    if (recommendation.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft recommendation can be shared",
      });
    }

    // At least one college must be recommended
    if (!recommendation.colleges || recommendation.colleges.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one college before sharing",
      });
    }

    // Find related counselling request
    const counsellingRequest = await CounsellingRequest.findById(
      recommendation.counsellingRequest
    );

    if (!counsellingRequest) {
      return res.status(404).json({
        success: false,
        message: "Counselling request not found",
      });
    }

    // Verify that this counsellor is assigned to the request
    if (String(counsellingRequest.assignedTo) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "This counselling request is not assigned to you",
      });
    }

    // Share recommendation
    const sharedAt = new Date();

    recommendation.status = "shared";
    recommendation.sharedAt = sharedAt;

    await recommendation.save();

    // Update counselling request status and history
    if (counsellingRequest.status !== "recommendations_shared") {
      const oldStatus = counsellingRequest.status;

      counsellingRequest.status = "recommendations_shared";

      counsellingRequest.statusHistory.push({
        oldStatus,
        newStatus: "recommendations_shared",
        updatedBy: userId,
        updatedAt: sharedAt,
      });

      await counsellingRequest.save();
    }

    // Fetch updated recommendation with populated data
    const updatedRecommendation = await CollegeRecommendation.findById(id)
      .populate("counsellingRequest")
      .populate({
        path: "student",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil",
      })
      .populate({
        path: "counsellor",
        select: "-password -otp -otpExpiresAt -otpAttempts -otpBlockedUntil",
      })
      .populate("colleges.college")
      .populate("colleges.collegeCourse")
      .populate("colleges.course")
      .populate("colleges.specialization");

    return res.status(200).json({
      success: true,
      message: "College recommendation shared successfully",
      data: updatedRecommendation,
    });
  } catch (error) {
    console.error("Share College Recommendation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to share college recommendation",
      error: error.message,
    });
  }
};


const respondToCollegeRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    // Only Student can respond
    if (role !== "Student") {
      return res.status(403).json({
        success: false,
        message: "Only students can respond to recommendations",
      });
    }

    const { response, remarks } = req.body;

    // Validate response
    if (!["accepted", "rejected"].includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Response must be accepted or rejected",
      });
    }

    // Validate remarks
    if (
      remarks !== undefined &&
      (typeof remarks !== "string" || remarks.trim().length > 2000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be a string of maximum 2000 characters",
      });
    }

    // Find recommendation
    const recommendation = await CollegeRecommendation.findById(
      req.params.id
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "College recommendation not found",
      });
    }

    // Check recommendation ownership
    if (recommendation.student.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot respond to another student's recommendation",
      });
    }

    // Recommendation must be shared
    if (recommendation.status !== "shared") {
      return res.status(400).json({
        success: false,
        message: "You can respond only to shared recommendations",
      });
    }

    // Prevent duplicate response
    if (recommendation.studentResponse.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "You have already responded to this recommendation",
      });
    }

    // Save student response
    recommendation.studentResponse.status = response;
    recommendation.studentResponse.remarks = remarks
      ? remarks.trim()
      : "";
    recommendation.studentResponse.respondedAt = new Date();

    await recommendation.save();

    return res.status(200).json({
      success: true,
      message: `Recommendation ${response} successfully`,
      data: {
        recommendationId: recommendation._id,
        studentResponse: recommendation.studentResponse,
      },
    });
  } catch (error) {
    console.error("Respond to College Recommendation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


module.exports = {
  createCollegeRecommendation,
  getAllCollegeRecommendations,
  getSingleCollegeRecommendation,
  updateCollegeRecommendation,
  shareCollegeRecommendation,
  respondToCollegeRecommendation
};
