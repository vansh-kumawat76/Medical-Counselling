const mongoose = require("mongoose");
const Degree = require("../models/Degree.js");
const Stream = require("../models/Stream.js");

const allowedLevels = [
  "certificate",
  "diploma",
  "undergraduate",
  "postgraduate",
  "doctoral",
  "postdoctoral",
  "other",
];

const allowedTypes = [
  "academic",
  "professional",
  "vocational",
  "research",
  "other",
];

const allowedStatuses = ["active", "inactive"];

const allowedSortFields = [
  "name",
  "shortName",
  "slug",
  "code",
  "level",
  "degreeType",
  "status",
  "displayOrder",
  "createdAt",
];

// ================= COMMON HELPERS =================

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const parseDisplayOrder = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error("displayOrder must be a non-negative number");
  }

  return number;
};

const parseDuration = (duration) => {
  if (duration === undefined) {
    return undefined;
  }

  if (duration === null) {
    return undefined;
  }

  if (
    typeof duration !== "object" ||
    Array.isArray(duration)
  ) {
    throw new Error("defaultDuration must be an object");
  }

  const result = {};

  if (duration.value !== undefined && duration.value !== "") {
    const value = Number(duration.value);

    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        "Duration value must be a non-negative number"
      );
    }

    result.value = value;
  }

  if (duration.unit !== undefined && duration.unit !== "") {
    if (!["months", "years"].includes(duration.unit)) {
      throw new Error(
        "Duration unit must be months or years"
      );
    }

    result.unit = duration.unit;
  }

  return result;
};

const validateStreams = async (streams) => {
  if (!Array.isArray(streams)) {
    throw new Error("Streams must be an array");
  }

  if (
    streams.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    )
  ) {
    throw new Error("Invalid Stream ID");
  }

  const streamIds = [
    ...new Set(streams.map((id) => String(id))),
  ];

  const count = await Stream.countDocuments({
    _id: { $in: streamIds },
  });

  if (count !== streamIds.length) {
    throw new Error("One or more streams were not found");
  }

  return streamIds;
};

const handleError = (error, res, fallbackMessage) => {
  console.error(fallbackMessage, error);

  if (error.code === 11000) {
    const field =
      Object.keys(error.keyPattern || {})[0] || "slug or code";

    return res.status(409).json({
      success: false,
      message: `Degree ${field} already exists`,
    });
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    error.message?.startsWith("Invalid ") ||
    error.message?.includes("must be") ||
    error.message?.includes("cannot be") ||
    error.message?.includes("Duration") ||
    error.message?.includes("Streams") ||
    error.message?.includes("stream")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

// Latest-created degree first. _id breaks ties consistently.
const latestFirstSort = {
  createdAt: -1,
  _id: -1,
};

// ================= CREATE DEGREE =================

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
      displayOrder,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof shortName !== "string" ||
      !shortName.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !level
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, shortName, slug and level are required",
      });
    }

    if (!allowedLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree level",
      });
    }

    if (
      degreeType !== undefined &&
      !allowedTypes.includes(degreeType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree type",
      });
    }

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive",
      });
    }

    const normalizedSlug = normalizeSlug(slug);
    const normalizedCode = normalizeCode(code);

    const duplicateConditions = [
      { slug: normalizedSlug },
    ];

    if (normalizedCode) {
      duplicateConditions.push({ code: normalizedCode });
    }

    const existingDegree = await Degree.findOne({
      $or: duplicateConditions,
    }).lean();

    if (existingDegree) {
      return res.status(409).json({
        success: false,
        message: "Degree slug or code already exists",
      });
    }

    const order = parseDisplayOrder(displayOrder);
    const duration = parseDuration(defaultDuration);

    const streamIds =
      streams === undefined
        ? []
        : await validateStreams(streams);

    const degreeData = {
      name: name.trim(),
      shortName: shortName.trim(),
      slug: normalizedSlug,
      level,
      degreeType: degreeType || "academic",
      description: description || "",
      streams: streamIds,
      status: status || "active",
      displayOrder: order,
    };

    if (normalizedCode) {
      degreeData.code = normalizedCode;
    }

    if (duration !== undefined) {
      degreeData.defaultDuration = duration;
    }

    if (
      req.user?.id &&
      mongoose.Types.ObjectId.isValid(req.user.id)
    ) {
      degreeData.createdBy = req.user.id;
    }

    const degree = await Degree.create(degreeData);

    return res.status(201).json({
      success: true,
      message: "Degree created successfully",
      data: degree,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Create Degree Error:"
    );
  }
}

// ================= GET ALL DEGREES =================

async function GetAllDegreeController(req, res) {
  try {
    const degrees = await Degree.find()
      .populate("streams", "name slug code")
      .populate("createdBy", "name email")
      .sort(latestFirstSort)
      .lean();

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Get All Degrees Error:"
    );
  }
}

// ================= GET DEGREE BY ID =================

async function GetDegreeByIdController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree ID",
      });
    }

    const degree = await Degree.findById(id)
      .populate("streams", "name slug code")
      .populate("createdBy", "name email");

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: "Degree not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: degree,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Get Degree By ID Error:"
    );
  }
}

// ================= EDIT DEGREE =================

async function EditDegreeController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree ID",
      });
    }

    const degree = await Degree.findById(id);

    if (!degree) {
      return res.status(404).json({
        success: false,
        message: "Degree not found",
      });
    }

    const body = req.body;

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid degree name",
        });
      }

      degree.name = body.name.trim();
    }

    if (body.shortName !== undefined) {
      if (
        typeof body.shortName !== "string" ||
        !body.shortName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shortName",
        });
      }

      degree.shortName = body.shortName.trim();
    }

    if (body.slug !== undefined) {
      if (
        typeof body.slug !== "string" ||
        !body.slug.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid slug",
        });
      }

      degree.slug = normalizeSlug(body.slug);
    }

    if (body.code !== undefined) {
      if (typeof body.code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid code",
        });
      }

      const normalizedCode = normalizeCode(body.code);

      if (normalizedCode) {
        degree.code = normalizedCode;
      } else {
        degree.code = undefined;
      }
    }

    if (body.level !== undefined) {
      if (!allowedLevels.includes(body.level)) {
        return res.status(400).json({
          success: false,
          message: "Invalid degree level",
        });
      }

      degree.level = body.level;
    }

    if (body.degreeType !== undefined) {
      if (!allowedTypes.includes(body.degreeType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid degree type",
        });
      }

      degree.degreeType = body.degreeType;
    }

    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      degree.status = body.status;
    }

    if (body.displayOrder !== undefined) {
      degree.displayOrder = parseDisplayOrder(
        body.displayOrder
      );
    }

    if (body.defaultDuration !== undefined) {
      const duration = parseDuration(
        body.defaultDuration
      );

      degree.defaultDuration = duration;
    }

    if (body.description !== undefined) {
      degree.description = body.description || "";
    }

    if (body.streams !== undefined) {
      degree.streams = await validateStreams(
        body.streams
      );
    }

    await degree.save();

    const updatedDegree = await Degree.findById(degree._id)
      .populate("streams", "name slug code")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Degree updated successfully",
      data: updatedDegree,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Edit Degree Error:"
    );
  }
}

// ================= DELETE DEGREE =================

async function DeleteDegreeController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree ID",
      });
    }

    const deletedDegree =
      await Degree.findByIdAndDelete(id);

    if (!deletedDegree) {
      return res.status(404).json({
        success: false,
        message: "Degree not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Degree deleted successfully",
      data: deletedDegree,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Delete Degree Error:"
    );
  }
}

// ================= SEARCH DEGREE =================

async function SearchDegreeController(req, res) {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        escapedSearch,
        "i"
      );

      filter.$or = [
        { name: regex },
        { shortName: regex },
        { slug: regex },
        { code: regex },
        { description: regex },
      ];
    }

    const degrees = await Degree.find(filter)
      .populate("streams", "name slug code")
      .populate("createdBy", "name email")
      .sort(latestFirstSort)
      .lean();

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Search Degree Error:"
    );
  }
}

// ================= FILTER DEGREE =================

async function FilterDegreeController(req, res) {
  try {
    const { level, degreeType, status } = req.query;
    const filter = {};

    if (level) {
      if (!allowedLevels.includes(level)) {
        return res.status(400).json({
          success: false,
          message: "Invalid degree level",
        });
      }

      filter.level = level;
    }

    if (degreeType) {
      if (!allowedTypes.includes(degreeType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid degree type",
        });
      }

      filter.degreeType = degreeType;
    }

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      filter.status = status;
    }

    const degrees = await Degree.find(filter)
      .populate("streams", "name slug code")
      .populate("createdBy", "name email")
      .sort(latestFirstSort)
      .lean();

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Filter Degree Error:"
    );
  }
}

// ================= SORT DEGREE =================

async function SortDegreeController(req, res) {
  try {
    const {
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Order must be asc or desc",
      });
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const degrees = await Degree.find()
      .populate("streams", "name slug code")
      .populate("createdBy", "name email")
      .sort({
        [sortBy]: sortOrder,
        _id: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: degrees.length,
      data: degrees,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Sort Degree Error:"
    );
  }
}

// ================= PAGINATION DEGREE =================

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
        message:
          "Page must be positive and limit must be between 1 and 100",
      });
    }

    const skip = (page - 1) * limit;

    const [degrees, totalDegrees] = await Promise.all([
      Degree.find()
        .populate("streams", "name slug code")
        .populate("createdBy", "name email")
        .sort(latestFirstSort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Degree.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(
        totalDegrees / limit
      ),
      totalDegrees,
      count: degrees.length,
      data: degrees,
    });
  } catch (error) {
    return handleError(
      error,
      res,
      "Pagination Degree Error:"
    );
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
  PaginationDegreeController,
};
