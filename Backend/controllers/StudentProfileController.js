const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const StudentProfile = require("../models/StudentProfile");
require("../models/EntranceExam");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const UserSession = require("../models/UserSession");
const Students = require("../models/Students");
const Caste = require("../models/Caste");
const mongoose = require("mongoose");
// ================= FULL NAME HELPER =================

function generateFullName(firstName, lastName) {
  return [firstName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ================= UPDATE STUDENT PROFILE =================

async function updateStudentProfile(req, res) {
  try {
    const userId = req.user.userId;

    const {
      personalDetails,
      dob,
      gender,
      city,
      state,
      country,
      academicDetails,
      entranceExams,
      preferredLocations,
      preferredCourses,
      budget,
    } = req.body;

    const studentProfile = await StudentProfile.findOne({
      user: userId,
    });

    if (!studentProfile) {
      return res.status(404).send({
        status: false,
        message: "The requested student profile could not be found.",
      });
    }

    // ================= PERSONAL DETAILS =================

    if (personalDetails !== undefined) {
      if (
        !personalDetails ||
        typeof personalDetails !== "object" ||
        Array.isArray(personalDetails)
      ) {
        return res.status(400).send({
          status: false,
          message: "The provided personal details are invalid. Please review your information.",
        });
      }

      // ================= CASTE VALIDATION =================

      if (personalDetails.casteDetails !== undefined) {
        const { casteDetails } = personalDetails;

        if (
          !casteDetails ||
          typeof casteDetails !== "object" ||
          Array.isArray(casteDetails)
        ) {
          return res.status(400).json({
            status: false,
            message: "Invalid caste details.",
          });
        }

        // Validate Central Caste
        if (
          Object.prototype.hasOwnProperty.call(
            casteDetails,
            "centralCaste"
          ) &&
          casteDetails.centralCaste !== null &&
          casteDetails.centralCaste !== ""
        ) {
          if (
            !mongoose.Types.ObjectId.isValid(
              casteDetails.centralCaste
            )
          ) {
            return res.status(400).json({
              status: false,
              message: "Invalid Central Caste ID.",
            });
          }

          const centralCaste = await Caste.findOne({
            _id: casteDetails.centralCaste,
            level: "Central",
            state: null,
            status: true,
          });

          if (!centralCaste) {
            return res.status(400).json({
              status: false,
              message: "Selected Central Caste not found or inactive.",
            });
          }
        }

        // Validate State Caste
        if (
          Object.prototype.hasOwnProperty.call(
            casteDetails,
            "stateCaste"
          ) &&
          casteDetails.stateCaste !== null &&
          casteDetails.stateCaste !== ""
        ) {
          if (
            !mongoose.Types.ObjectId.isValid(
              casteDetails.stateCaste
            )
          ) {
            return res.status(400).json({
              status: false,
              message: "Invalid State Caste ID.",
            });
          }

          const stateCaste = await Caste.findOne({
            _id: casteDetails.stateCaste,
            level: "State",
            state: { $ne: null },
            status: true,
          });

          if (!stateCaste) {
            return res.status(400).json({
              status: false,
              message: "Selected State Caste not found or inactive.",
            });
          }
        }
      }

      const existingDetails =
        studentProfile.personalDetails?.toObject?.() ||
        studentProfile.personalDetails ||
        {};

      const updatedDetails = {
        ...existingDetails,
        ...personalDetails,
      };

      // Preserve existing father details
      const existingFather = existingDetails.father || {};

      const updatedFather = {
        ...existingFather,
        ...(personalDetails.father || {}),
      };

      updatedFather.fullName = generateFullName(
        updatedFather.firstName,
        updatedFather.lastName
      );

      // Preserve existing mother details
      const existingMother = existingDetails.mother || {};

      const updatedMother = {
        ...existingMother,
        ...(personalDetails.mother || {}),
      };

      updatedMother.fullName = generateFullName(
        updatedMother.firstName,
        updatedMother.lastName
      );

      // Generate Student Full Name
      updatedDetails.fullName = generateFullName(
        updatedDetails.firstName,
        updatedDetails.lastName
      );

      // Preserve existing caste details
      const existingCasteDetails =
        existingDetails.casteDetails || {};

      const updatedCasteDetails = {
        ...existingCasteDetails,
        ...(personalDetails.casteDetails || {}),
      };

      updatedDetails.casteDetails = updatedCasteDetails;

      updatedDetails.father = updatedFather;
      updatedDetails.mother = updatedMother;

      studentProfile.personalDetails = updatedDetails;
    }

    // ================= BASIC DETAILS =================

    if (dob !== undefined) studentProfile.dob = dob;
    if (gender !== undefined) studentProfile.gender = gender;
    if (city !== undefined) studentProfile.city = city;
    if (state !== undefined) studentProfile.state = state;
    if (country !== undefined) studentProfile.country = country;

    // ================= ACADEMIC DETAILS =================

    if (academicDetails !== undefined) {
      const existingAcademic =
        studentProfile.academicDetails?.toObject?.() ||
        studentProfile.academicDetails ||
        {};

      studentProfile.academicDetails = {
        ...existingAcademic,
        ...academicDetails,

        tenth: {
          ...(existingAcademic.tenth || {}),
          ...(academicDetails.tenth || {}),
        },

        twelfth: {
          ...(existingAcademic.twelfth || {}),
          ...(academicDetails.twelfth || {}),
        },

        graduation: {
          ...(existingAcademic.graduation || {}),
          ...(academicDetails.graduation || {}),
        },
      };
    }

    // ================= ENTRANCE EXAMS =================

    if (entranceExams !== undefined) {
      studentProfile.entranceExams = entranceExams;
    }

    // ================= PREFERRED LOCATIONS =================

    if (preferredLocations !== undefined) {
      studentProfile.preferredLocations = preferredLocations;
    }

    // ================= PREFERRED COURSES =================

    if (preferredCourses !== undefined) {
      studentProfile.preferredCourses = preferredCourses;
    }

    // ================= BUDGET =================

    if (budget !== undefined) {
      const existingBudget =
        studentProfile.budget?.toObject?.() ||
        studentProfile.budget ||
        {};

      studentProfile.budget = {
        ...existingBudget,
        ...budget,
      };
    }

    await studentProfile.save();

    // ================= FETCH UPDATED PROFILE =================

    const updatedProfile = await StudentProfile.findById(
      studentProfile._id
    )
      .populate("preferredCourses")
      .populate("entranceExams.exam")
      .populate("personalDetails.casteDetails.centralCaste")
      .populate("personalDetails.casteDetails.stateCaste");

    return res.status(200).send({
      status: true,
      message: "Your student profile has been updated successfully.",
      data: updatedProfile,
    });

  } catch (error) {
    console.error("Update Student Profile Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error.message,
    });
  }
}

// ================= GET STUDENT PROFILE =================

async function getStudentProfile(req, res) {
  try {
    const userId = req.user.userId;

    const studentProfile = await StudentProfile.findOne({
      user: userId,
    })
      .populate("preferredCourses")
      .populate("entranceExams.exam")
      .populate("personalDetails.casteDetails.centralCaste")
.populate("personalDetails.casteDetails.stateCaste");

    if (!studentProfile) {
      return res.status(404).send({
        status: false,
        message: "The requested student profile could not be found.",
      });
    }

    return res.status(200).send({
      status: true,
      message: "Student profile details retrieved successfully.",
      data: studentProfile,
    });

  } catch (error) {
    console.error("Get Student Profile Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error.message,
    });
  }
}

// ================= UPLOAD PROFILE IMAGE =================

async function uploadStudentProfileImage(req, res) {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).send({
        status: false,
        message: "Please select a valid image to continue.",
      });
    }

    const studentProfile = await StudentProfile.findOne({
      user: userId,
    });

    if (!studentProfile) {
      return res.status(404).send({
        status: false,
        message: "The requested student profile could not be found.",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "medical-counselling/profile-images",
          public_id: `student-${userId}`,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      Readable.from(req.file.buffer).pipe(stream);
    });

    studentProfile.profileImage = uploadResult.secure_url;

    await studentProfile.save();

    return res.status(200).send({
      status: true,
      message: "Your profile image has been uploaded successfully.",
      data: {
        profileImage: studentProfile.profileImage,
      },
    });

  } catch (error) {
    console.error("Upload Student Profile Image Error:", error);

    return res.status(500).send({
      status: false,
      message: "We couldn't upload your profile image. Please try again later.",
    });
  }
}

// ================= UPLOAD COVER IMAGE =================

async function uploadStudentCoverImage(req, res) {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).send({
        status: false,
        message: "Please select a valid image to continue.",
      });
    }

    const studentProfile = await StudentProfile.findOne({
      user: userId,
    });

    if (!studentProfile) {
      return res.status(404).send({
        status: false,
        message: "The requested student profile could not be found.",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "medical-counselling/cover-images",
          public_id: `student-cover-${userId}`,
          overwrite: true,
          resource_type: "image",
          transformation: [
            { width: 1600, height: 900, crop: "limit" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      Readable.from(req.file.buffer).pipe(stream);
    });

    studentProfile.coverImage = uploadResult.secure_url;

    await studentProfile.save();

    return res.status(200).send({
      status: true,
      message: "Your cover image has been uploaded successfully.",
      data: {
        coverImage: studentProfile.coverImage,
      },
    });

  } catch (error) {
    console.error("Upload Student Cover Image Error:", error);

    return res.status(500).send({
      status: false,
      message: "We couldn't upload your cover image. Please try again later.",
    });
  }
}


// ================= DEACTIVATE STUDENT ACCOUNT =================


async function deactivateStudentAccount(req, res) {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication is required to deactivate your account.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: false,
        message: "Please enter your current password to confirm account deactivation.",
      });
    }

    const student = await User.findById(userId).populate("role");

    if (!student) {
      return res.status(404).json({
        status: false,
        message: "Your student account could not be found. Please contact support.",
      });
    }

    if (student.role?.role !== "Student") {
      return res.status(403).json({
        status: false,
        message: "Only student accounts can be deactivated.",
      });
    }

    if (!student.password) {
      return res.status(400).json({
        status: false,
        message: "Your account password is not configured. Please contact support.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      student.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        status: false,
        message: "The password you entered is incorrect. Please verify your password and try again.",
      });
    }

    if (student.accountStatus === "deactivated") {
      return res.status(400).json({
        status: false,
        message: "Your account has already been deactivated.",
      });
    }

    student.accountStatus = "deactivated";

    await student.save();

    return res.status(200).json({
      status: true,
      message: "Your account has been successfully deactivated. You will no longer have access to student services.",
    });

  } catch (error) {
    console.error("Deactivate Student Account Error:", error);

    return res.status(500).json({
      status: false,
      message: "We couldn't process your account deactivation request. Please try again later.",
    });
  }
}


// ================= GET ACTIVE SESSIONS =================

async function getActiveSessions(req, res) {
  try {
    const userId = req.user?.userId;
    const currentSessionId = req.user?.sessionId;

    if (!userId || !currentSessionId) {
      return res.status(401).json({
        status: false,
        message: "Please log in again to view your active sessions.",
      });
    }

    const currentSession = await UserSession.findOne({
      userId,
      sessionId: currentSessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!currentSession) {
      return res.status(401).json({
        status: false,
        message: "Your current session is invalid or expired.",
      });
    }

    const sessions = await UserSession.find({
      userId,
      accountModel: currentSession.accountModel,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .select(
        "sessionId device browser os ipAddress loginAt lastActiveAt expiresAt"
      )
      .sort({ lastActiveAt: -1 })
      .lean();

    const formattedSessions = sessions.map((session) => ({
      ...session,
      isCurrent: session.sessionId === currentSessionId,
    }));

    return res.status(200).json({
      status: true,
      message: "Active sessions retrieved successfully.",
      total: formattedSessions.length,
      currentSessionId,
      data: formattedSessions,
    });
  } catch (error) {
    console.error("Get Active Sessions Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to retrieve active sessions.",
    });
  }
}


// ================= TERMINATE SINGLE SESSION =================

async function terminateSession(req, res) {
  try {
    const userId = req.user?.userId;
    const currentSessionId = req.user?.sessionId;
    const { sessionId } = req.params;

    if (!userId || !currentSessionId) {
      return res.status(401).json({
        status: false,
        message: "Authentication is required.",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid session ID.",
      });
    }

    const currentSession = await UserSession.findOne({
      userId,
      sessionId: currentSessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!currentSession) {
      return res.status(401).json({
        status: false,
        message: "Your current session is invalid or expired.",
      });
    }

    const targetSession = await UserSession.findOne({
      userId,
      accountModel: currentSession.accountModel,
      sessionId,
      isActive: true,
    });

    if (!targetSession) {
      return res.status(404).json({
        status: false,
        message: "The requested active session could not be found.",
      });
    }

    targetSession.isActive = false;
    targetSession.terminatedAt = new Date();
    targetSession.terminationReason = "revoked";

    await targetSession.save();

    return res.status(200).json({
      status: true,
      message:
        sessionId === currentSessionId
          ? "Your current session has been terminated."
          : "The selected session has been terminated successfully.",
    });
  } catch (error) {
    console.error("Terminate Session Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to terminate the selected session.",
    });
  }
}


// ================= LOGOUT OTHER SESSIONS =================

async function logoutOtherSessions(req, res) {
  try {
    const userId = req.user?.userId;
    const currentSessionId = req.user?.sessionId;

    if (!userId || !currentSessionId) {
      return res.status(401).json({
        status: false,
        message: "Authentication is required.",
      });
    }

    const currentSession = await UserSession.findOne({
      userId,
      sessionId: currentSessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!currentSession) {
      return res.status(401).json({
        status: false,
        message: "Your current session is invalid or expired.",
      });
    }

    const result = await UserSession.updateMany(
      {
        userId,
        accountModel: currentSession.accountModel,
        sessionId: { $ne: currentSessionId },
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: "revoked",
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "All other sessions have been logged out successfully.",
      terminatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Logout Other Sessions Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to log out other sessions.",
    });
  }
}

// ================= ACCOUNT SECURITY INFORMATION =================

async function getAccountSecurity(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication is required.",
      });
    }

    let account = await User.findById(userId)
      .select("email role accountStatus createdAt lastLoginAt passwordChangedAt")
      .populate("role", "role")
      .lean();

    let accountModel = "User";

    if (!account) {
      account = await Students.findById(userId)
        .select("email role status createdAt lastLoginAt passwordChangedAt")
        .populate("role", "role")
        .lean();

      accountModel = "Students";
    }

    if (!account) {
      return res.status(404).json({
        status: false,
        message: "Account information could not be found.",
      });
    }

    const accountStatus =
      account.accountStatus ||
      account.status ||
      "active";

    return res.status(200).json({
      status: true,
      message: "Account security information retrieved successfully.",
      data: {
        email: account.email,
        accountType: accountModel,
        role: account.role?.role || "Unknown",
        accountStatus,
        accountCreatedAt: account.createdAt || null,
        lastLoginAt: account.lastLoginAt || null,
        passwordChangedAt: account.passwordChangedAt || null,
        securityStatus: "Account information available",
      },
    });
  } catch (error) {
    console.error("Get Account Security Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to retrieve account security information.",
    });
  }
}

// ================= EXPORTS =================

module.exports = {
  updateStudentProfile,
  getStudentProfile,
  uploadStudentProfileImage,
  uploadStudentCoverImage,
  deactivateStudentAccount,
  getActiveSessions,
  terminateSession,
  logoutOtherSessions,
  getAccountSecurity
};
