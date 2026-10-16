const mongoose = require("mongoose");
const Stream = require("../models/Stream");

const allowedStatuses = ["active", "inactive", "pending"];

const allowedStreamTypes = [
  "government",
  "private",
  "deemed",
  "autonomous",
  "public",
];

// ================= CREATE SLUG =================
const createSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ================= VALIDATE PARENT STREAM =================
const validateParentStream = async (parentStream, currentId = null) => {
  if (
    parentStream === undefined ||
    parentStream === null ||
    parentStream === ""
  ) {
    return null;
  }

  if (!mongoose.isValidObjectId(parentStream)) {
    throw new Error("Invalid parent stream ID.");
  }

  if (currentId && String(parentStream) === String(currentId)) {
    throw new Error("A stream cannot be its own parent.");
  }

  const parent = await Stream.findById(parentStream);

  if (!parent) {
    throw new Error("Parent stream not found.");
  }

  // Prevent circular parent relationships.
  if (currentId) {
    let ancestorId = parent.parentStream;
    const visited = new Set([String(currentId)]);

    while (ancestorId) {
      const ancestorKey = String(ancestorId);

      if (visited.has(ancestorKey)) {
        throw new Error("Circular parent stream relationship detected.");
      }

      visited.add(ancestorKey);

      const ancestor = await Stream.findById(ancestorId)
        .select("parentStream")
        .lean();

      if (!ancestor) break;

      ancestorId = ancestor.parentStream;
    }
  }

  return parent._id;
};

// ================= DUPLICATE ERROR HANDLER =================
const handleDuplicateError = (error, res) => {
  if (error.code === 11000) {
    const field =
      Object.keys(error.keyPattern || {})[0] ||
      Object.keys(error.keyValue || {})[0] ||
      "field";

    res.status(409).json({
      status: false,
      message: `This ${field} already exists.`,
    });

    return true;
  }

  return false;
};

// ================= ADD STREAM =================
const StreamController = async (req, res) => {
  try {
    const {
      name,
      slug,
      code,
      description,
      icon,
      image,
      logo,
      parentStream,
      displayOrder,
      status,
      streamType,
      isVerified,
      createdBy,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: "Stream name is required.",
      });
    }

    const finalSlug = createSlug(slug || name);

    if (!finalSlug) {
      return res.status(400).json({
        status: false,
        message: "A valid stream slug is required.",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid stream status.",
      });
    }

    if (!allowedStreamTypes.includes(streamType)) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid stream type. Allowed values: government, private, deemed, autonomous, public.",
      });
    }

    if (isVerified !== undefined && typeof isVerified !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "isVerified must be a boolean.",
      });
    }

    if (createdBy && !mongoose.isValidObjectId(createdBy)) {
      return res.status(400).json({
        status: false,
        message: "Invalid createdBy user ID.",
      });
    }

    let order = 0;

    if (
      displayOrder !== undefined &&
      displayOrder !== null &&
      displayOrder !== ""
    ) {
      order = Number(displayOrder);

      if (!Number.isFinite(order) || order < 0) {
        return res.status(400).json({
          status: false,
          message: "Display order must be a non-negative number.",
        });
      }
    }

    const parentId = await validateParentStream(parentStream);

    const streamData = {
      name: name.trim(),
      slug: finalSlug,
      description: description || "",
      icon: icon || null,
      image: image || null,
      logo: logo || null,
      parentStream: parentId,
      displayOrder: order,
      status: status || "pending",
      streamType,
      isVerified: isVerified ?? false,
    };

    if (code && String(code).trim()) {
      streamData.code = String(code).trim().toUpperCase();
    }

    if (createdBy) {
      streamData.createdBy = createdBy;
    }

    const stream = await Stream.create(streamData);

    return res.status(201).json({
      status: true,
      message: "Stream added successfully.",
      stream,
    });
  } catch (error) {
    if (handleDuplicateError(error, res)) return;

    return res.status(400).json({
      status: false,
      message: error.message || "Unable to add stream.",
    });
  }
};

// ================= GET ALL STREAMS =================
const GetStreamController = async (req, res) => {
  try {
    const streams = await Stream.find()
      .populate("parentStream", "name slug")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      status: true,
      count: streams.length,
      streams,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Unable to fetch streams.",
    });
  }
};

// ================= EDIT STREAM =================
const EditStreamHandler = async (req, res) => {
  try {
    const { id, ...body } = req.body;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "A valid stream ID is required.",
      });
    }

    const stream = await Stream.findById(id);

    if (!stream) {
      return res.status(404).json({
        status: false,
        message: "Stream not found.",
      });
    }

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return res.status(400).json({
          status: false,
          message: "Stream name cannot be empty.",
        });
      }

      stream.name = body.name.trim();
    }

    if (body.slug !== undefined || body.name !== undefined) {
      const slugSource =
        body.slug !== undefined
          ? body.slug || body.name || stream.name
          : body.name || stream.name;

      const finalSlug = createSlug(slugSource);

      if (!finalSlug) {
        return res.status(400).json({
          status: false,
          message: "A valid stream slug is required.",
        });
      }

      stream.slug = finalSlug;
    }

    if (body.code !== undefined) {
      if (typeof body.code !== "string") {
        return res.status(400).json({
          status: false,
          message: "Code must be a string.",
        });
      }

      stream.code = body.code.trim()
        ? body.code.trim().toUpperCase()
        : undefined;
    }

    if (body.description !== undefined) {
      stream.description = body.description || "";
    }

    if (body.icon !== undefined) {
      stream.icon = body.icon || null;
    }

    if (body.image !== undefined) {
      stream.image = body.image || null;
    }

    if (body.logo !== undefined) {
      stream.logo = body.logo || null;
    }

    if (body.isVerified !== undefined) {
      if (typeof body.isVerified !== "boolean") {
        return res.status(400).json({
          status: false,
          message: "isVerified must be a boolean.",
        });
      }

      stream.isVerified = body.isVerified;
    }

    if (body.streamType !== undefined) {
      if (!allowedStreamTypes.includes(body.streamType)) {
        return res.status(400).json({
          status: false,
          message: "Invalid stream type.",
        });
      }

      stream.streamType = body.streamType;
    }

    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return res.status(400).json({
          status: false,
          message: "Status must be active, inactive or pending.",
        });
      }

      stream.status = body.status;
    }

    if (body.displayOrder !== undefined) {
      const order = Number(body.displayOrder);

      if (body.displayOrder === "" || !Number.isFinite(order) || order < 0) {
        return res.status(400).json({
          status: false,
          message: "Display order must be a non-negative number.",
        });
      }

      stream.displayOrder = order;
    }

    if (body.parentStream !== undefined) {
      stream.parentStream = await validateParentStream(body.parentStream, id);
    }

    await stream.save();

    return res.status(200).json({
      status: true,
      message: "Stream updated successfully.",
      stream,
    });
  } catch (error) {
    if (handleDuplicateError(error, res)) return;

    return res.status(400).json({
      status: false,
      message: error.message || "Unable to update stream.",
    });
  }
};

// ================= DELETE STREAM =================
const DeleteStreamHandler = async (req, res) => {
  try {
    const id = req.body.id || req.query.id;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "A valid stream ID is required.",
      });
    }

    const stream = await Stream.findById(id);

    if (!stream) {
      return res.status(404).json({
        status: false,
        message: "Stream not found.",
      });
    }

    const hasChildren = await Stream.exists({
      parentStream: id,
    });

    if (hasChildren) {
      return res.status(409).json({
        status: false,
        message:
          "Delete or reassign child streams before deleting this stream.",
      });
    }

    await Stream.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "Stream deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Unable to delete stream.",
    });
  }
};

// ================= SEARCH, FILTER, SORT, PAGINATION =================
const SearchStreamController = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid status filter.",
      });
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);

    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const sortField = ["name", "createdAt", "displayOrder", "status"].includes(
      sortBy,
    )
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (typeof search === "string" && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: regex },
        { slug: regex },
        { code: regex },
        { description: regex },
      ];
    }

    const [streams, total] = await Promise.all([
      Stream.find(filter)
        .populate("parentStream", "name slug")
        .populate("createdBy", "name email")
        .sort({ [sortField]: sortOrder, _id: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      Stream.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: true,
      streams,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Unable to search streams.",
    });
  }
};

module.exports = {
  StreamController,
  GetStreamController,
  EditStreamHandler,
  DeleteStreamHandler,
  SearchStreamController,
};
