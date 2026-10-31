const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const StudentProfile = require("../models/StudentProfile");
require("../models/EntranceExam");

async function updateStudentProfile(req, res) {
  try {
    const userId = req.user.userId;

    const {
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
        message: "Student profile not found",
      });
    }

    // Update only fields provided in request
    if (dob !== undefined) studentProfile.dob = dob;
    if (gender !== undefined) studentProfile.gender = gender;
    if (city !== undefined) studentProfile.city = city;
    if (state !== undefined) studentProfile.state = state;
    if (country !== undefined) studentProfile.country = country;

    // Preserve existing academic details
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

    if (entranceExams !== undefined) {
      studentProfile.entranceExams = entranceExams;
    }

    if (preferredLocations !== undefined) {
      studentProfile.preferredLocations = preferredLocations;
    }

    if (preferredCourses !== undefined) {
      studentProfile.preferredCourses = preferredCourses;
    }

    // Preserve existing budget values
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

    // Return populated course and exam information
    const updatedProfile = await StudentProfile.findById(
      studentProfile._id
    )
      .populate("preferredCourses")
      .populate("entranceExams.exam");

    return res.status(200).send({
      status: true,
      message: "Student profile updated successfully",
      data: updatedProfile,
    });

  } catch (error) {
    console.error("Update Student Profile Error:", error);

    return res.status(500).send({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

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
        message: "Student profile not found",
      });
    }

    return res.status(200).send({
      status: true,
      message: "Student profile fetched successfully",
      data: studentProfile,
    });

  } catch (error) {
    console.error("Get Student Profile Error:", error);

    return res.status(500).send({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
async function uploadStudentProfileImage(req, res) {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).send({
        status: false,
        message: "Please select an image",
      });
    }

    const studentProfile = await StudentProfile.findOne({
      user: userId,
    });

    if (!studentProfile) {
      return res.status(404).send({
        status: false,
        message: "Student profile not found",
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
      message: "Profile image uploaded successfully",
      data: {
        profileImage: studentProfile.profileImage,
      },
    });
  } catch (error) {
    console.error("Upload Student Profile Image Error:", error);

    return res.status(500).send({
      status: false,
      message: "Unable to upload profile image",
    });
  }
}
module.exports = {
  updateStudentProfile,
  getStudentProfile,
  uploadStudentProfileImage,
};
