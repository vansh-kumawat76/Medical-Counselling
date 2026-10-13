const mongoose = require("mongoose");
const Specialization = require("../models/Specialization");
const Course = require("../models/Course");

// Helper: validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: safely escape search text for regex
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper: populate complete Course document
const populateCourse = (query) => query.populate("course");

// ADD SPECIALIZATION
const AddSpecializationController = async (req, res) => {
  try {
    const {
      name,
      slug,
      code,
      description,
      course,
      duration,
      eligibility,
      careerOptions,
      status,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !course
    ) {
      return res.status(400).json({
        status: false,
        message: "Name, slug and course are required",
      });
    }

    if (!isValidId(course)) {
      return res.status(400).json({
        status: false,
        message: "Invalid course ID",
      });
    }

    const courseExists = await Course.findById(course);

    if (!courseExists) {
      return res.status(404).json({
        status: false,
        message: "Course not found",
      });
    }

    const normalizedSlug = slug.trim().toLowerCase();
    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : undefined;

    const duplicateConditions = [{ slug: normalizedSlug }];

    if (normalizedCode) {
      duplicateConditions.push({ code: normalizedCode });
    }

    const duplicate = await Specialization.findOne({
      $or: duplicateConditions,
    });

    if (duplicate) {
      return res.status(409).json({
        status: false,
        message: "Slug or code already exists",
      });
    }

    const specialization = await Specialization.create({
      name: name.trim(),
      slug: normalizedSlug,
      code: normalizedCode || undefined,
      description,
      course,
      duration,
      eligibility,
      careerOptions,
      status,
      createdBy: req.user?._id,
    });

    const data = await populateCourse(
      Specialization.findById(specialization._id)
    );

    return res.status(201).json({
      status: true,
      message: "Specialization added successfully",
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Slug or code already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// GET ALL SPECIALIZATIONS
const GetAllSpecializationsController = async (req, res) => {
  try {
    const data = await populateCourse(
      Specialization.find().sort({ createdAt: -1 })
    );

    return res.status(200).json({
      status: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// GET SPECIALIZATION BY ID
const GetSpecializationByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid specialization ID",
      });
    }

    const data = await populateCourse(
      Specialization.findById(id)
    );

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Specialization not found",
      });
    }

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// EDIT SPECIALIZATION
const EditSpecializationController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid specialization ID",
      });
    }

    const existing = await Specialization.findById(id);

    if (!existing) {
      return res.status(404).json({
        status: false,
        message: "Specialization not found",
      });
    }

    // Only allow fields defined in the Specialization schema
    const allowedFields = [
      "name",
      "slug",
      "code",
      "description",
      "course",
      "duration",
      "eligibility",
      "careerOptions",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "name") &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        status: false,
        message: "Name cannot be empty",
      });
    }

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updates, "slug")) {
      if (typeof updates.slug !== "string" || !updates.slug.trim()) {
        return res.status(400).json({
          status: false,
          message: "Slug cannot be empty",
        });
      }

      updates.slug = updates.slug.trim().toLowerCase();
    }

    if (Object.prototype.hasOwnProperty.call(updates, "code")) {
      if (typeof updates.code !== "string") {
        return res.status(400).json({
          status: false,
          message: "Code must be a string",
        });
      }

      updates.code = updates.code.trim().toUpperCase() || undefined;
    }

    if (updates.course) {
      if (!isValidId(updates.course)) {
        return res.status(400).json({
          status: false,
          message: "Invalid course ID",
        });
      }

      const courseExists = await Course.findById(updates.course);

      if (!courseExists) {
        return res.status(404).json({
          status: false,
          message: "Course not found",
        });
      }
    }

    // Check duplicate slug/code, excluding the current document
    const duplicateConditions = [];

    if (updates.slug) {
      duplicateConditions.push({ slug: updates.slug });
    }

    if (updates.code) {
      duplicateConditions.push({ code: updates.code });
    }

    if (duplicateConditions.length > 0) {
      const duplicate = await Specialization.findOne({
        _id: { $ne: id },
        $or: duplicateConditions,
      });

      if (duplicate) {
        return res.status(409).json({
          status: false,
          message: "Slug or code already exists",
        });
      }
    }

    const data = await populateCourse(
      Specialization.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      })
    );

    return res.status(200).json({
      status: true,
      message: "Specialization updated successfully",
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Slug or code already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// DELETE SPECIALIZATION
const DeleteSpecializationController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid specialization ID",
      });
    }

    const data = await Specialization.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Specialization not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Specialization deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// SEARCH SPECIALIZATIONS
const SearchSpecializationController = async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const filter = {};

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { code: searchRegex },
      ];
    }

    const data = await populateCourse(
      Specialization.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      status: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// FILTER SPECIALIZATIONS
const FilterSpecializationController = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!["active", "inactive"].includes(req.query.status)) {
        return res.status(400).json({
          status: false,
          message: "Status must be active or inactive",
        });
      }

      filter.status = req.query.status;
    }

    if (req.query.course) {
      if (!isValidId(req.query.course)) {
        return res.status(400).json({
          status: false,
          message: "Invalid course ID",
        });
      }

      filter.course = req.query.course;
    }

    const data = await populateCourse(
      Specialization.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      status: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// SORT SPECIALIZATIONS
const SortSpecializationController = async (req, res) => {
  try {
    const allowedFields = ["name", "createdAt", "status"];

    const sortBy = allowedFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

    const order = req.query.order === "asc" ? 1 : -1;

    const data = await populateCourse(
      Specialization.find().sort({ [sortBy]: order })
    );

    return res.status(200).json({
      status: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// PAGINATION SPECIALIZATIONS
const PaginationSpecializationController = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const [data, total] = await Promise.all([
      populateCourse(
        Specialization.find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ),
      Specialization.countDocuments(),
    ]);

    return res.status(200).json({
      status: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  AddSpecializationController,
  GetAllSpecializationsController,
  GetSpecializationByIdController,
  EditSpecializationController,
  DeleteSpecializationController,
  SearchSpecializationController,
  FilterSpecializationController,
  SortSpecializationController,
  PaginationSpecializationController,
};