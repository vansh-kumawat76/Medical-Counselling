const mongoose = require("mongoose");
const Degree = require("../models/Degree.js");
const Stream = require("../models/Stream.js");

// CREATE DEGREE
async function degreeCreateController(req, res) {
  try {
    const {
      name,
      shortName,
      slug,
      code,
      level,
      degreeType,
      defaultDuration,
      description,
      streams,
      status,
      displayOrder
    } = req.body;

    if (!name?.trim() || !shortName?.trim() || !slug?.trim() || !level) {
      return res.status(400).json({
        success: false,
        message: "Name, shortName, slug and level are required"
      });
    }

    const allowedLevels = [
      "certificate",
      "diploma",
      "undergraduate",
      "postgraduate",
      "doctoral",
      "postdoctoral",
      "other"
    ];

    const allowedTypes = [
      "academic",
      "professional",
      "vocational",
      "research",
      "other"
    ];

    if (!allowedLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree level"
      });
    }

    if (degreeType && !allowedTypes.includes(degreeType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree type"
      });
    }

    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive"
      });
    }

    if (
      displayOrder !== undefined &&
      (!Number.isFinite(displayOrder) || displayOrder < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "displayOrder must be a non-negative number"
      });
    }

    if (
      defaultDuration?.value !== undefined &&
      (!Number.isFinite(defaultDuration.value) ||
        defaultDuration.value < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration value must be a non-negative number"
      });
    }

    if (
      defaultDuration?.unit !== undefined &&
      !["months", "years"].includes(defaultDuration.unit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration unit must be months or years"
      });
    }

    const normalizedSlug = slug.trim().toLowerCase();
    const normalizedCode = code?.trim().toUpperCase();

    const duplicateConditions = [{ slug: normalizedSlug }];

    if (normalizedCode) {
      duplicateConditions.push({ code: normalizedCode });
    }

    const existingDegree = await Degree.findOne({
      $or: duplicateConditions
    });

    if (existingDegree) {
      return res.status(409).json({
        success: false,
        message: "Degree slug or code already exists"
      });
    }

    let streamIds = [];

    if (streams !== undefined) {
      if (!Array.isArray(streams)) {
        return res.status(400).json({
          success: false,
          message: "Streams must be an array"
        });
      }

      if (streams.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid Stream ID"
        });
      }

      streamIds = [...new Set(streams.map(String))];

      const streamCount = await Stream.countDocuments({
        _id: { $in: streamIds }
      });

      if (streamCount !== streamIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more streams were not found"
        });
      }
    }

    const degreeData = {
      name: name.trim(),
      shortName: shortName.trim(),
      slug: normalizedSlug,
      code: normalizedCode || undefined,
      level,
      degreeType: degreeType || "academic",
      defaultDuration,
      description: description || "",
      streams: streamIds,
      status: status || "active",
      displayOrder: displayOrder ?? 0
    };

    // Use this only if authentication middleware sets req.user.
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      degreeData.createdBy = req.user.id;
    }

    const degree = await Degree.create(degreeData);

    return res.status(201).json({
      success: true,
      message: "Degree created successfully",
      data: degree
    });
  } catch (error) {
    console.error("Create Degree Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Degree slug or code already exists"
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// GET ALL DEGREES
async function GetAllDegreeController(req, res) {
  try {
    const degrees = await Degree.find()
      .populate("streams", "name slug code")
      .populate("createdBy", "name email")
      .sort({ displayOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees
    });
  } catch (error) {
    console.error("Get All Degrees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// GET DEGREE BY ID
async function GetDegreeByIdController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree ID"
      });
    }

    const degree = await Degree.findById(id)
      .populate("streams", "name slug code")
      .populate("createdBy", "name email");

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: "Degree not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: degree
    });
  } catch (error) {
    console.error("Get Degree By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// EDIT DEGREE
async function EditDegreeController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree ID"
      });
    }

    const allowedFields = [
      "name",
      "shortName",
      "slug",
      "code",
      "level",
      "degreeType",
      "defaultDuration",
      "description",
      "streams",
      "status",
      "displayOrder"
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
          message: "Invalid degree name"
        });
      }
      updates.name = updates.name.trim();
    }

    if (updates.shortName !== undefined) {
      if (
        typeof updates.shortName !== "string" ||
        !updates.shortName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shortName"
        });
      }
      updates.shortName = updates.shortName.trim();
    }

    if (updates.slug !== undefined) {
      if (typeof updates.slug !== "string" || !updates.slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid slug"
        });
      }
      updates.slug = updates.slug.trim().toLowerCase();
    }

    if (updates.code !== undefined) {
      if (typeof updates.code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid code"
        });
      }
      updates.code = updates.code.trim().toUpperCase() || undefined;
    }

    if (
      updates.level !== undefined &&
      ![
        "certificate",
        "diploma",
        "undergraduate",
        "postgraduate",
        "doctoral",
        "postdoctoral",
        "other"
      ].includes(updates.level)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree level"
      });
    }

    if (
      updates.degreeType !== undefined &&
      ![
        "academic",
        "professional",
        "vocational",
        "research",
        "other"
      ].includes(updates.degreeType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree type"
      });
    }

    if (
      updates.status !== undefined &&
      !["active", "inactive"].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    if (
      updates.displayOrder !== undefined &&
      (!Number.isFinite(updates.displayOrder) ||
        updates.displayOrder < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "displayOrder must be a non-negative number"
      });
    }

    if (updates.defaultDuration !== undefined) {
      const duration = updates.defaultDuration;

      if (
        duration !== null &&
        (typeof duration !== "object" ||
          Array.isArray(duration) ||
          (duration.value !== undefined &&
            (!Number.isFinite(duration.value) || duration.value < 0)) ||
          (duration.unit !== undefined &&
            !["months", "years"].includes(duration.unit)))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid defaultDuration"
        });
      }
    }

    if (updates.streams !== undefined) {
      if (!Array.isArray(updates.streams)) {
        return res.status(400).json({
          success: false,
          message: "Streams must be an array"
        });
      }

      if (
        updates.streams.some(
          (streamId) => !mongoose.Types.ObjectId.isValid(streamId)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Stream ID"
        });
      }

      updates.streams = [...new Set(updates.streams.map(String))];

      const streamCount = await Stream.countDocuments({
        _id: { $in: updates.streams }
      });

      if (streamCount !== updates.streams.length) {
        return res.status(400).json({
          success: false,
          message: "One or more streams were not found"
        });
      }
    }

    const updatedDegree = await Degree.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("streams", "name slug code")
      .populate("createdBy", "name email");

    if (!updatedDegree) {
      return res.status(404).json({
        success: false,
        message: "Degree not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Degree updated successfully",
      data: updatedDegree
    });
  } catch (error) {
    console.error("Edit Degree Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Degree slug or code already exists"
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// DELETE DEGREE
async function DeleteDegreeController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree ID"
      });
    }

    const deletedDegree = await Degree.findByIdAndDelete(id);

    if (!deletedDegree) {
      return res.status(404).json({
        success: false,
        message: "Degree not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Degree deleted successfully",
      data: deletedDegree
    });
  } catch (error) {
    console.error("Delete Degree Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// SEARCH DEGREE
async function SearchDegreeController(req, res) {
  try {
    const search = (req.query.search || "").trim();

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required"
      });
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "i");

    const degrees = await Degree.find({
      $or: [
        { name: regex },
        { shortName: regex },
        { slug: regex },
        { code: regex },
        { description: regex }
      ]
    })
      .populate("streams", "name slug code")
      .sort({ displayOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees
    });
  } catch (error) {
    console.error("Search Degree Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// FILTER DEGREE
async function FilterDegreeController(req, res) {
  try {
    const { level, degreeType, status } = req.query;
    const filter = {};

    if (level) filter.level = level;
    if (degreeType) filter.degreeType = degreeType;
    if (status) filter.status = status;

    const degrees = await Degree.find(filter)
      .populate("streams", "name slug code")
      .sort({ displayOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees
    });
  } catch (error) {
    console.error("Filter Degree Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// SORT DEGREE
async function SortDegreeController(req, res) {
  try {
    const { sortBy = "displayOrder", order = "asc" } = req.query;

    const allowedFields = [
      "name",
      "shortName",
      "slug",
      "code",
      "level",
      "degreeType",
      "status",
      "displayOrder",
      "createdAt"
    ];

    if (!allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field"
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Order must be asc or desc"
      });
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const degrees = await Degree.find()
      .populate("streams", "name slug code")
      .sort({ [sortBy]: sortOrder });

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees
    });
  } catch (error) {
    console.error("Sort Degree Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// PAGINATION DEGREE
async function PaginationDegreeController(req, res) {
  try {
    let { page = "1", limit = "5" } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100"
      });
    }

    const skip = (page - 1) * limit;

    const [degrees, totalDegrees] = await Promise.all([
      Degree.find()
        .populate("streams", "name slug code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Degree.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalDegrees / limit),
      totalDegrees,
      count: degrees.length,
      data: degrees
    });
  } catch (error) {
    console.error("Pagination Degree Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {
  degreeCreateController,
  GetAllDegreeController,
  EditDegreeController,
  DeleteDegreeController,
  GetDegreeByIdController,
  SearchDegreeController,
  FilterDegreeController,
  SortDegreeController,
  PaginationDegreeController
};

