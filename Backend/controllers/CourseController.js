
const mongoose = require("mongoose");
const Course = require("../models/Course.js");
const Degree = require("../models/Degree.js");
const Stream = require("../models/Stream.js");

const ALLOWED_STATUSES = ["active", "inactive"];

const ALLOWED_SORT_FIELDS = [
  "name",
  "slug",
  "code",
  "createdAt",
  "updatedAt",
  "status",
];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const handleError = (res, error, label) => {
  console.error(`${label}:`, error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A course with this slug or code already exists.",
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred. Please try again later.",
  });
};

// VALIDATE DEGREE AND STREAM REFERENCES
async function validateReferences(body) {
  if (body.degree !== undefined) {
    if (!isValidId(body.degree)) {
      return {
        valid: false,
        message: "The provided degree ID is invalid.",
      };
    }

    const degree = await Degree.findById(body.degree);

    if (!degree) {
      return {
        valid: false,
        message: "The requested degree could not be found.",
      };
    }
  }

  if (body.stream !== undefined) {
    if (!isValidId(body.stream)) {
      return {
        valid: false,
        message: "The provided stream ID is invalid.",
      };
    }

    const stream = await Stream.findById(body.stream);

    if (!stream) {
      return {
        valid: false,
        message: "The requested stream could not be found.",
      };
    }
  }

  return { valid: true };
}

// VALIDATE DURATION
function validateDuration(duration) {
  if (!duration || typeof duration !== "object" || Array.isArray(duration)) {
    return {
      valid: false,
      message: "Please provide a valid duration object containing a value and unit.",
    };
  }

  if (
    duration.value !== undefined &&
    (typeof duration.value !== "number" ||
      !Number.isFinite(duration.value) ||
      duration.value < 0)
  ) {
    return {
      valid: false,
      message: "The duration value must be a non-negative number.",
    };
  }

  if (!["months", "years"].includes(duration.unit)) {
    return {
      valid: false,
      message: "The duration unit must be either 'months' or 'years'.",
    };
  }

  return { valid: true };
}

// VALIDATE ELIGIBILITY
function validateEligibility(eligibility) {
  if (
    !eligibility ||
    typeof eligibility !== "object" ||
    Array.isArray(eligibility)
  ) {
    return {
      valid: false,
      message: "Please provide eligibility details as a valid object.",
    };
  }

  const percentage = eligibility.minimumPercentage;

  if (
    percentage !== undefined &&
    (typeof percentage !== "number" ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100)
  ) {
    return {
      valid: false,
      message: "The minimum percentage must be between 0 and 100.",
    };
  }

  if (
    eligibility.requiredSubjects !== undefined &&
    (!Array.isArray(eligibility.requiredSubjects) ||
      eligibility.requiredSubjects.some(
        (subject) => typeof subject !== "string",
      ))
  ) {
    return {
      valid: false,
      message: "Required subjects must be provided as an array of strings.",
    };
  }

  return { valid: true };
}

// CREATE COURSE
const AddCourseController = async (req, res) => {
  try {
    const {
      name,
      slug,
      code,
      description,
      stream,
      degree,
      duration,
      eligibility,
      status,
      seo,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !degree ||
      !stream ||
      !duration
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide the course name, slug, degree, stream, and duration.",
      });
    }

    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'inactive'.",
      });
    }

    const durationValidation = validateDuration(duration);

    if (!durationValidation.valid) {
      return res.status(400).json({
        success: false,
        message: durationValidation.message,
      });
    }

    if (eligibility !== undefined) {
      const eligibilityValidation = validateEligibility(eligibility);

      if (!eligibilityValidation.valid) {
        return res.status(400).json({
          success: false,
          message: eligibilityValidation.message,
        });
      }
    }

    const normalizedSlug = slug.trim().toLowerCase();
    let normalizedCode;

    if (code !== undefined && code !== null && code !== "") {
      if (typeof code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid course code.",
        });
      }

      normalizedCode = code.trim().toUpperCase() || undefined;
    }

    const duplicateConditions = [{ slug: normalizedSlug }];

    if (normalizedCode) {
      duplicateConditions.push({ code: normalizedCode });
    }

    const existingCourse = await Course.findOne({
      $or: duplicateConditions,
    });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: "A course with this slug or code already exists.",
      });
    }

    const referenceValidation = await validateReferences({
      degree,
      stream,
    });

    if (!referenceValidation.valid) {
      return res.status(400).json({
        success: false,
        message: referenceValidation.message,
      });
    }

    const courseData = {
      name: name.trim(),
      slug: normalizedSlug,
      code: normalizedCode,
      description: description || "",
      degree,
      stream,
      duration,
      eligibility,
      status: status || "active",
      seo,
    };

    if (req.user?._id && isValidId(req.user._id)) {
      courseData.createdBy = req.user._id;
    }

    const course = await Course.create(courseData);

    return res.status(201).json({
      success: true,
      message: "The course has been created successfully.",
      data: course,
    });
  } catch (error) {
    return handleError(res, error, "Create Course Error");
  }
};

// GET ALL COURSES
const GetAllCoursesController = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("degree", "name shortName slug level")
      .populate("stream", "name slug code")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return handleError(res, error, "Get All Courses Error");
  }
};

// GET COURSE BY ID
const GetCourseByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "The provided course ID is invalid.",
      });
    }

    const course = await Course.findById(id)
      .populate("degree", "name shortName slug level")
      .populate("stream", "name slug code")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "The requested course could not be found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    return handleError(res, error, "Get Course By ID Error");
  }
};

// EDIT COURSE
const EditCourseController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "The provided course ID is invalid.",
      });
    }

    const allowedFields = [
      "name",
      "slug",
      "code",
      "description",
      "stream",
      "degree",
      "duration",
      "eligibility",
      "status",
      "seo",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid course name.",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.slug !== undefined) {
      if (typeof updates.slug !== "string" || !updates.slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid course slug.",
        });
      }

      updates.slug = updates.slug.trim().toLowerCase();
    }

    if (updates.code !== undefined) {
      if (typeof updates.code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid course code.",
        });
      }

      updates.code = updates.code.trim().toUpperCase() || undefined;
    }

    if (
      updates.status !== undefined &&
      !ALLOWED_STATUSES.includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'inactive'.",
      });
    }

    if (updates.duration !== undefined) {
      const durationValidation = validateDuration(updates.duration);

      if (!durationValidation.valid) {
        return res.status(400).json({
          success: false,
          message: durationValidation.message,
        });
      }
    }

    if (updates.eligibility !== undefined) {
      const eligibilityValidation = validateEligibility(updates.eligibility);

      if (!eligibilityValidation.valid) {
        return res.status(400).json({
          success: false,
          message: eligibilityValidation.message,
        });
      }
    }

    const referenceValidation = await validateReferences(updates);

    if (!referenceValidation.valid) {
      return res.status(400).json({
        success: false,
        message: referenceValidation.message,
      });
    }

    if (updates.slug !== undefined || updates.code !== undefined) {
      const duplicateConditions = [];

      if (updates.slug !== undefined) {
        duplicateConditions.push({ slug: updates.slug });
      }

      if (updates.code !== undefined) {
        duplicateConditions.push({
          code: updates.code || { $exists: false },
        });
      }

      if (duplicateConditions.length > 0) {
        const duplicate = await Course.findOne({
          _id: { $ne: id },
          $or: duplicateConditions,
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: "A course with this slug or code already exists.",
          });
        }
      }
    }

    if (req.user?._id && isValidId(req.user._id)) {
      updates.updatedBy = req.user._id;
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .populate("degree", "name shortName slug level")
      .populate("stream", "name slug code")
      .populate("createdBy", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "The requested course could not be found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "The course has been updated successfully.",
      data: course,
    });
  } catch (error) {
    return handleError(res, error, "Edit Course Error");
  }
};

// DELETE COURSE
const DeleteCourseController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "The provided course ID is invalid.",
      });
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "The requested course could not be found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "The course has been deleted successfully.",
      data: course,
    });
  } catch (error) {
    return handleError(res, error, "Delete Course Error");
  }
};

// SEARCH COURSES
const SearchCourseController = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search keyword.",
      });
    }

    const regex = new RegExp(escapeRegex(search), "i");

    const courses = await Course.find({
      $or: [
        { name: regex },
        { slug: regex },
        { code: regex },
        { description: regex },
      ],
    })
      .populate("degree", "name shortName")
      .populate("stream", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return handleError(res, error, "Search Courses Error");
  }
};

// FILTER COURSES
const FilterCourseController = async (req, res) => {
  try {
    const { status, degree, stream } = req.query;
    const filter = {};

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid course status.",
        });
      }

      filter.status = status;
    }

    if (degree) {
      if (!isValidId(degree)) {
        return res.status(400).json({
          success: false,
          message: "The provided degree ID is invalid.",
        });
      }

      filter.degree = degree;
    }

    if (stream) {
      if (!isValidId(stream)) {
        return res.status(400).json({
          success: false,
          message: "The provided stream ID is invalid.",
        });
      }

      filter.stream = stream;
    }

    const courses = await Course.find(filter)
      .populate("degree", "name shortName")
      .populate("stream", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return handleError(res, error, "Filter Courses Error");
  }
};

// SORT COURSES
const SortCourseController = async (req, res) => {
  try {
    const { sortBy = "createdAt", order = "desc" } = req.query;

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "The selected sort field is invalid.",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be either 'asc' or 'desc'.",
      });
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const courses = await Course.find()
      .populate("degree", "name shortName")
      .populate("stream", "name slug")
      .sort({ [sortBy]: sortOrder });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return handleError(res, error, "Sort Courses Error");
  }
};

// PAGINATION COURSES
const PaginationCourseController = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 9);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "The page number must be a positive integer, and the limit must be between 1 and 100.",
      });
    }

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find()
        .populate("degree", "name shortName")
        .populate("stream", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Course.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(res, error, "Pagination Courses Error");
  }
};

module.exports = {
  AddCourseController,
  GetAllCoursesController,
  GetCourseByIdController,
  EditCourseController,
  DeleteCourseController,
  SearchCourseController,
  FilterCourseController,
  SortCourseController,
  PaginationCourseController,
};
