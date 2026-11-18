const CollegeCourse = require("../models/CollegeCourse");
const College = require("../models/Colleges");
const Course = require("../models/Course");
const mongoose = require("mongoose");

const createCollegeCourse = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);
    console.log("Request body:", req.body);

    const {
      college,
      course,
      specialization,
      duration,
      totalSeats,
      availableSeats,
      mode,
      admissionOpen,
      applicationDeadline,
      totalFees,
      yearlyFees,
      currency,
      eligibility,
      scholarshipAvailable,
      additionalCharges,
      entranceExams,
      status
    } = req.body;

    // Required fields validation
    if (!college || !course) {
      return res.status(400).json({
        success: false,
        message: "College and Course are required"
      });
    }

    // Validate College ID
    if (!mongoose.Types.ObjectId.isValid(college)) {
      return res.status(400).json({
        success: false,
        message: "Invalid College ID"
      });
    }

    // Validate Course ID
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID"
      });
    }

    console.log("College ID:", college);
    console.log("Course ID:", course);

    // Find College
    const findCollege = await College.findById(college);
    console.log("Found College:", findCollege);

    if (!findCollege) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    // Find Course
    const findCourse = await Course.findById(course);
    console.log("Found Course:", findCourse);

    if (!findCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check duplicate College + Course
    const existingCollegeCourse = await CollegeCourse.findOne({
      college,
      course
    });

    console.log("Existing CollegeCourse:", existingCollegeCourse);

    if (existingCollegeCourse) {
      return res.status(400).json({
        success: false,
        message: "This course is already linked with this college"
      });
    }

    // Create College Course
    const newCollegeCourse = await CollegeCourse.create({
      college,
      course,
      specialization,
      duration,
      totalSeats,
      availableSeats,
      mode,
      admissionOpen,
      applicationDeadline,
      totalFees,
      yearlyFees,
      currency,
      eligibility,
      scholarshipAvailable,
      additionalCharges,
      entranceExams,
      status
    });

    console.log("New CollegeCourse Created:", newCollegeCourse);

    return res.status(201).json({
      success: true,
      message: "College course created successfully",
      data: newCollegeCourse
    });

  } catch (error) {
    console.error("Create College Course Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create college course",
      error: error.message
    });
  }
};


const getAllCollegeCourses = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);

    const collegeCourses = await CollegeCourse.find()
      .populate({
        path: "college",
        select: "name logo location collegeType ownership status"
      })
      .populate({
        path: "course",
        select: "name shortName code duration stream degree status"
      })
      .populate({
        path: "specialization",
        select: "name"
      })
      .populate({
        path: "entranceExams",
        select: "name shortName"
      })
      .sort({ createdAt: -1 });

    console.log("Total College Courses:", collegeCourses.length);

    return res.status(200).json({
      success: true,
      message: "College courses fetched successfully",
      count: collegeCourses.length,
      data: collegeCourses
    });

  } catch (error) {
    console.error("Get All College Courses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch college courses",
      error: error.message
    });
  }
};


const getSingleCollegeCourse = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);

    const { id } = req.params;

    console.log("College Course ID:", id);

    const collegeCourse = await CollegeCourse.findById(id)
      .populate({
        path: "college",
        select: "name logo location collegeType ownership status"
      })
      .populate({
        path: "course",
        select: "name shortName code duration stream degree status"
      })
      .populate({
        path: "specialization",
        select: "name"
      })
      .populate({
        path: "entranceExams",
        select: "name shortName"
      });

    if (!collegeCourse) {
      return res.status(404).json({
        success: false,
        message: "College course not found"
      });
    }

    console.log("College Course Found:", collegeCourse._id);

    return res.status(200).json({
      success: true,
      message: "College course fetched successfully",
      data: collegeCourse
    });

  } catch (error) {
    console.error("Get Single College Course Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch college course",
      error: error.message
    });
  }
};


const updateCollegeCourse = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);

    const { id } = req.params;

    const {
      college,
      course,
      specialization,
      duration,
      totalSeats,
      availableSeats,
      mode,
      admissionOpen,
      applicationDeadline,
      totalFees,
      yearlyFees,
      currency,
      additionalCharges,
      eligibility,
      entranceExams,
      scholarshipAvailable,
      status
    } = req.body;

    console.log("College Course ID:", id);
    console.log("Update Data:", req.body);

    // Find existing College Course
    const collegeCourse = await CollegeCourse.findById(id);

    if (!collegeCourse) {
      return res.status(404).json({
        success: false,
        message: "College course not found"
      });
    }

    // Validate College if provided
    if (college) {
      const collegeExists = await College.findById(college);

      if (!collegeExists) {
        return res.status(404).json({
          success: false,
          message: "College not found"
        });
      }
    }

    // Validate Course if provided
    if (course) {
      const courseExists = await Course.findById(course);

      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }
    }

    // Check duplicate College + Course combination
    const updatedCollege = college || collegeCourse.college;
    const updatedCourse = course || collegeCourse.course;

    const duplicateCourse = await CollegeCourse.findOne({
      _id: { $ne: id },
      college: updatedCollege,
      course: updatedCourse
    });

    if (duplicateCourse) {
      return res.status(400).json({
        success: false,
        message: "This course is already linked with this college"
      });
    }

    // Update only provided fields
    if (college !== undefined) collegeCourse.college = college;
    if (course !== undefined) collegeCourse.course = course;
    if (specialization !== undefined) collegeCourse.specialization = specialization;
    if (duration !== undefined) collegeCourse.duration = duration;
    if (totalSeats !== undefined) collegeCourse.totalSeats = totalSeats;
    if (availableSeats !== undefined) collegeCourse.availableSeats = availableSeats;
    if (mode !== undefined) collegeCourse.mode = mode;
    if (admissionOpen !== undefined) collegeCourse.admissionOpen = admissionOpen;
    if (applicationDeadline !== undefined) collegeCourse.applicationDeadline = applicationDeadline;
    if (totalFees !== undefined) collegeCourse.totalFees = totalFees;
    if (yearlyFees !== undefined) collegeCourse.yearlyFees = yearlyFees;
    if (currency !== undefined) collegeCourse.currency = currency;
    if (additionalCharges !== undefined) collegeCourse.additionalCharges = additionalCharges;
    if (eligibility !== undefined) collegeCourse.eligibility = eligibility;
    if (entranceExams !== undefined) collegeCourse.entranceExams = entranceExams;
    if (scholarshipAvailable !== undefined) collegeCourse.scholarshipAvailable = scholarshipAvailable;
    if (status !== undefined) collegeCourse.status = status;

    await collegeCourse.save();

    // Fetch updated record with populated details
    const updatedCollegeCourse = await CollegeCourse.findById(id)
      .populate({
        path: "college",
        select: "name logo location collegeType ownership status"
      })
      .populate({
        path: "course",
        select: "name shortName code duration stream degree status"
      })
      .populate({
        path: "specialization",
        select: "name"
      })
      .populate({
        path: "entranceExams",
        select: "name shortName"
      });

    return res.status(200).json({
      success: true,
      message: "College course updated successfully",
      data: updatedCollegeCourse
    });

  } catch (error) {
    console.error("Update College Course Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update college course",
      error: error.message
    });
  }
};


const deleteCollegeCourse = async (req, res) => {
  try {
    console.log("Logged in user:", req.user);

    const { id } = req.params;

    console.log("College Course ID:", id);

    // Find College Course
    const collegeCourse = await CollegeCourse.findById(id);

    if (!collegeCourse) {
      return res.status(404).json({
        success: false,
        message: "College course not found"
      });
    }

    // Permanently Delete College Course
    await CollegeCourse.findByIdAndDelete(id);

    console.log("College Course Permanently Deleted:", id);

    return res.status(200).json({
      success: true,
      message: "College course permanently deleted successfully",
      data: {
        _id: id
      }
    });

  } catch (error) {
    console.error("Delete College Course Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete college course",
      error: error.message
    });
  }
};


const getCollegeCoursesByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required"
      });
    }

    const collegeCourses = await CollegeCourse.find({
      college: collegeId
    })
      .populate({
        path: "course",
        select: "name shortName code duration stream degree status"
      })
      .populate({
        path: "specialization",
        select: "name"
      })
      .populate({
        path: "entranceExams",
        select: "name shortName"
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "College courses fetched successfully",
      count: collegeCourses.length,
      data: collegeCourses
    });

  } catch (error) {
    console.error("Get College Courses By College Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch college courses",
      error: error.message
    });
  }
};

module.exports = { createCollegeCourse, getAllCollegeCourses, getSingleCollegeCourse, updateCollegeCourse, deleteCollegeCourse,getCollegeCoursesByCollege};