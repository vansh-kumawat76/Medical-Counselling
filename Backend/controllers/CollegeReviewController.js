const mongoose = require("mongoose");
const CollegeReview = require("../models/CollegeReview");
const College = require("../models/Colleges");
const UserSession = require("../models/UserSession");
const User = require("../models/User");
const Students = require("../models/Students");
const { redisClient } = require("../config/redis");

async function clearCollegeReviewCache(collegeId) {
  if (!redisClient.isReady) return;

  try {
    const keys = redisClient.scanIterator({
      MATCH: `cache:*/college/${collegeId}`,
      COUNT: 100,
    });

    for await (const key of keys) {
      await redisClient.del(key);
    }

    console.log("College Review Cache Cleared Successfully!");
  } catch (error) {
    console.error("College Review Cache Clear Error:", error.message);
  }
}

// Get logged-in student's account information
const getStudentAccount = async (req) => {
  const session = await UserSession.findOne({
    sessionId: req.user.sessionId,
    userId: req.user.userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  return {
    studentId: session.userId,
    studentModel: session.accountModel,
  };
};

// Create College Review
exports.createCollegeReview = async (req, res) => {
  try {
    const {
      college,
      overallRating,
      department,
      departmentRating,
      facilities,
      reviewTitle,
      review,
      pros,
      cons,
      studyYear,
    } = req.body;

    if (!college || overallRating === undefined || !reviewTitle || !review) {
      return res.status(400).json({
        success: false,
        message: "College, rating, title and review are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(college)) {
      return res.status(400).json({
        success: false,
        message: "Invalid college ID",
      });
    }

    const collegeExists = await College.findOne({
      _id: college,
      status: "active",
    });

    if (!collegeExists) {
      return res.status(404).json({
        success: false,
        message: "Active college not found",
      });
    }

    const studentAccount = await getStudentAccount(req);

    if (!studentAccount) {
      return res.status(401).json({
        success: false,
        message: "Student session not found",
      });
    }

    const existingReview = await CollegeReview.findOne({
      college,
      student: studentAccount.studentId,
      studentModel: studentAccount.studentModel,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this college",
      });
    }

    const newReview = await CollegeReview.create({
      college,
      student: studentAccount.studentId,
      studentModel: studentAccount.studentModel,
      overallRating,
      department,
      departmentRating,
      facilities,
      reviewTitle,
      review,
      pros,
      cons,
      studyYear,
    });

    return res.status(201).json({
      success: true,
      message: "College review submitted successfully. Waiting for approval.",
      data: newReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this college",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Approved Reviews of a College
exports.getCollegeReviews = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid college ID",
      });
    }

    const reviews = await CollegeReview.find({
      college: collegeId,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    for (const item of reviews) {
      const AccountModel = item.studentModel === "Students" ? Students : User;

      const student = await AccountModel.findById(item.student)
        .select("name")
        .lean();

      item.student = student
        ? { _id: student._id, name: student.name || "Student" }
        : null;
    }

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Logged-in Student's Reviews
exports.getMyCollegeReviews = async (req, res) => {
  try {
    const studentAccount = await getStudentAccount(req);

    if (!studentAccount) {
      return res.status(401).json({
        success: false,
        message: "Student session not found",
      });
    }

    const reviews = await CollegeReview.find({
      student: studentAccount.studentId,
      studentModel: studentAccount.studentModel,
    })
      .populate("college", "name logo slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Own Review
exports.updateCollegeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const studentAccount = await getStudentAccount(req);

    if (!studentAccount) {
      return res.status(401).json({
        success: false,
        message: "Student session not found",
      });
    }

    const allowedFields = [
      "overallRating",
      "department",
      "departmentRating",
      "facilities",
      "reviewTitle",
      "review",
      "pros",
      "cons",
      "studyYear",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedReview = await CollegeReview.findOneAndUpdate(
      {
        _id: reviewId,
        student: studentAccount.studentId,
        studentModel: studentAccount.studentModel,
      },
      {
        $set: {
          ...updateData,
          status: "pending",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you are not authorized",
      });
    }
    await clearCollegeReviewCache(updatedReview.college);
    return res.status(200).json({
      success: true,
      message: "Review updated successfully. Waiting for approval.",
      data: updatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Own Review
exports.deleteCollegeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const studentAccount = await getStudentAccount(req);

    if (!studentAccount) {
      return res.status(401).json({
        success: false,
        message: "Student session not found",
      });
    }

    const deletedReview = await CollegeReview.findOneAndDelete({
      _id: reviewId,
      student: studentAccount.studentId,
      studentModel: studentAccount.studentModel,
    });

    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you are not authorized",
      });
    }
    await clearCollegeReviewCache(deletedReview.college);
    return res.status(200).json({
      success: true,
      message: "College review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Recalculate College Rating (Only Approved Reviews)
const updateCollegeRating = async (collegeId) => {
  const result = await CollegeReview.aggregate([
    {
      $match: {
        college: new mongoose.Types.ObjectId(collegeId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$college",
        average: { $avg: "$overallRating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = result.length ? Number(result[0].average.toFixed(1)) : 0;

  const count = result.length ? result[0].count : 0;

  await College.findByIdAndUpdate(collegeId, {
    $set: {
      "rating.average": average,
      "rating.count": count,
    },
  });
};

// Admin: Get All College Reviews
exports.getAllCollegeReviews = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review status",
        });
      }

      filter.status = status;
    }

    const reviews = await CollegeReview.find(filter)
      .populate("college", "name logo slug")
      .sort({ createdAt: -1 })
      .lean();

    for (const item of reviews) {
      const AccountModel = item.studentModel === "Students" ? Students : User;

      const student = await AccountModel.findById(item.student)
        .select("name email")
        .lean();

      item.student = student
        ? {
            _id: student._id,
            name: student.name || "Student",
            email: student.email,
          }
        : null;
    }

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: Approve College Review
exports.approveCollegeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await CollegeReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "College review not found",
      });
    }

    if (review.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Review is already approved",
      });
    }

    review.status = "approved";
    await review.save();

    await updateCollegeRating(review.college);
    await clearCollegeReviewCache(review.college);
    return res.status(200).json({
      success: true,
      message: "College review approved successfully",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: Reject College Review
exports.rejectCollegeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await CollegeReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "College review not found",
      });
    }

    if (review.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Review is already rejected",
      });
    }

    review.status = "rejected";
    await review.save();

    await updateCollegeRating(review.college);
    await clearCollegeReviewCache(review.college);
    return res.status(200).json({
      success: true,
      message: "College review rejected successfully",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: Delete Any College Review
exports.adminDeleteCollegeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const deletedReview = await CollegeReview.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: "College review not found",
      });
    }
    await clearCollegeReviewCache(deletedReview.college);
    await updateCollegeRating(deletedReview.college);

    return res.status(200).json({
      success: true,
      message: "College review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
