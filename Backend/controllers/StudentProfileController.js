
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const StudentProfile = require("../models/StudentProfile");
require("../models/EntranceExam");

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

      // Generate Father's Full Name
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

      // Generate Mother's Full Name
      updatedMother.fullName = generateFullName(
        updatedMother.firstName,
        updatedMother.lastName
      );

      // Generate Student Full Name
      updatedDetails.fullName = generateFullName(
        updatedDetails.firstName,
        updatedDetails.lastName
      );

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
      .populate("entranceExams.exam");

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
      .populate("entranceExams.exam");

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

// ================= EXPORTS =================

module.exports = {
  updateStudentProfile,
  getStudentProfile,
  uploadStudentProfileImage,
  uploadStudentCoverImage,
};
