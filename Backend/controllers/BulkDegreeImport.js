
const Degree = require("../models/Degree");
const Stream = require("../models/Stream");
const mongoose = require("mongoose");
const { parse } = require("csv-parse/sync");

const BulkDegreeImportController = async (req, res) => {
  try {
    let degrees = [];

    // CSV file upload OR JSON body support
    if (req.file) {
      degrees = parse(req.file.buffer.toString("utf-8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } else {
      degrees = req.body?.degrees;
    }

    if (!Array.isArray(degrees) || degrees.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please upload a CSV file or provide an array of degrees.",
      });
    }

    if (degrees.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 degrees can be imported at once.",
      });
    }

    const validLevels = [
      "certificate",
      "diploma",
      "undergraduate",
      "postgraduate",
      "doctoral",
      "postdoctoral",
      "other",
    ];

    const validDegreeTypes = [
      "academic",
      "professional",
      "vocational",
      "research",
      "other",
    ];

    const validStatuses = ["active", "inactive"];

    const results = [];
    const validDegrees = [];
    const seenSlugs = new Set();
    const seenCodes = new Set();

    for (let i = 0; i < degrees.length; i++) {
      const row = degrees[i];
      const rowNumber = i + 1;
      const errors = [];

      if (!row || typeof row !== "object" || Array.isArray(row)) {
        results.push({
          row: rowNumber,
          status: "failed",
          message: "Invalid degree data.",
        });
        continue;
      }

      const name = String(row.name || "").trim();
      const shortName = String(row.shortName || "").trim();
      const slug = String(row.slug || "").trim().toLowerCase();
      const code = String(row.code || "").trim().toUpperCase();

      const level = String(row.level || "").trim().toLowerCase();

      const degreeType = String(
        row.degreeType || "academic"
      ).trim().toLowerCase();

      const status = String(
        row.status || "active"
      ).trim().toLowerCase();

      const description = String(row.description || "").trim();

      const displayOrder =
        row.displayOrder === "" || row.displayOrder == null
          ? 0
          : Number(row.displayOrder);

      if (!name) errors.push("Name is required.");
      if (!shortName) errors.push("Short name is required.");

      if (!slug) {
        errors.push("Slug is required.");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.push("Invalid slug format.");
      }

      if (!validLevels.includes(level)) {
        errors.push(`Invalid level. Allowed: ${validLevels.join(", ")}`);
      }

      if (!validDegreeTypes.includes(degreeType)) {
        errors.push(
          `Invalid degree type. Allowed: ${validDegreeTypes.join(", ")}`
        );
      }

      if (!validStatuses.includes(status)) {
        errors.push("Status must be active or inactive.");
      }

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        errors.push("Display order must be a non-negative integer.");
      }

      // Duration validation
      let defaultDuration;

      const durationValue = row.durationValue;
      const durationUnit = String(
        row.durationUnit || ""
      ).trim().toLowerCase();

      if (durationValue !== "" && durationValue != null) {
        const value = Number(durationValue);

        if (!Number.isFinite(value) || value < 0) {
          errors.push("Invalid duration value.");
        } else if (!["months", "years"].includes(durationUnit)) {
          errors.push("Duration unit must be months or years.");
        } else {
          defaultDuration = {
            value,
            unit: durationUnit,
          };
        }
      }

      // Parse stream codes or MongoDB ObjectIds
      let streamValues = [];

      if (Array.isArray(row.streams)) {
        streamValues = row.streams;
      } else if (
        typeof row.streams === "string" &&
        row.streams.trim()
      ) {
        streamValues = row.streams.split(/[,|]/);
      }

      streamValues = streamValues
        .map((value) => String(value).trim())
        .filter(Boolean);

      // Duplicate checking inside CSV
      if (slug && seenSlugs.has(slug)) {
        errors.push("Duplicate slug in CSV.");
      }

      if (code && seenCodes.has(code)) {
        errors.push("Duplicate code in CSV.");
      }

      if (slug) seenSlugs.add(slug);
      if (code) seenCodes.add(code);

      if (errors.length) {
        results.push({
          row: rowNumber,
          status: "failed",
          message: errors.join(" "),
        });
        continue;
      }

      validDegrees.push({
        row: rowNumber,
        streamValues,
        data: {
          name,
          shortName,
          slug,
          ...(code ? { code } : {}),
          level,
          degreeType,
          ...(defaultDuration ? { defaultDuration } : {}),
          description,
          status,
          displayOrder,
        },
      });
    }

    // Resolve stream codes and ObjectIds into actual MongoDB ObjectIds
    const allStreamValues = [
      ...new Set(
        validDegrees.flatMap((item) => item.streamValues)
      ),
    ];

    const streamObjectIds = allStreamValues.filter((value) =>
      mongoose.Types.ObjectId.isValid(value)
    );

    const streamCodes = allStreamValues
      .filter((value) => !mongoose.Types.ObjectId.isValid(value))
      .map((value) => value.toUpperCase());

    const streamConditions = [];

    if (streamObjectIds.length) {
      streamConditions.push({
        _id: { $in: streamObjectIds },
      });
    }

    if (streamCodes.length) {
      streamConditions.push({
        code: { $in: streamCodes },
      });
    }

    const existingStreams = streamConditions.length
      ? await Stream.find({
          $or: streamConditions,
        })
          .select("_id code")
          .lean()
      : [];

    const streamMap = new Map();

    existingStreams.forEach((stream) => {
      streamMap.set(String(stream._id), stream._id);

      if (stream.code) {
        streamMap.set(stream.code.toUpperCase(), stream._id);
      }
    });

    // Attach resolved stream ObjectIds to each degree
    const checkedDegrees = [];

    for (const item of validDegrees) {
      const resolvedStreams = [];
      const missingStreams = [];

      for (const value of item.streamValues) {
        const key = mongoose.Types.ObjectId.isValid(value)
          ? String(value)
          : value.toUpperCase();

        const streamId = streamMap.get(key);

        if (!streamId) {
          missingStreams.push(value);
        } else {
          resolvedStreams.push(streamId);
        }
      }

      if (missingStreams.length) {
        results.push({
          row: item.row,
          status: "failed",
          message: `Stream not found: ${missingStreams.join(", ")}`,
        });
      } else {
        item.data.streams = [
          ...new Map(
            resolvedStreams.map((id) => [String(id), id])
          ).values(),
        ];

        checkedDegrees.push(item);
      }
    }

    // Check duplicate slugs and codes in database
    const slugs = checkedDegrees.map(
      (item) => item.data.slug
    );

    const codes = checkedDegrees
      .map((item) => item.data.code)
      .filter(Boolean);

    const existing = slugs.length
      ? await Degree.find({
          $or: [
            { slug: { $in: slugs } },
            ...(codes.length ? [{ code: { $in: codes } }] : []),
          ],
        })
          .select("slug code")
          .lean()
      : [];

    const existingSlugs = new Set(
      existing.map((item) => item.slug)
    );

    const existingCodes = new Set(
      existing.map((item) => item.code).filter(Boolean)
    );

    const toInsert = [];

    for (const item of checkedDegrees) {
      const errors = [];

      if (existingSlugs.has(item.data.slug)) {
        errors.push(`Slug already exists: ${item.data.slug}`);
      }

      if (item.data.code && existingCodes.has(item.data.code)) {
        errors.push(`Code already exists: ${item.data.code}`);
      }

      if (errors.length) {
        results.push({
          row: item.row,
          status: "failed",
          name: item.data.name,
          message: errors.join(", "),
        });
      } else {
        toInsert.push(item);

        // Prevent duplicate values among records being inserted
        existingSlugs.add(item.data.slug);

        if (item.data.code) {
          existingCodes.add(item.data.code);
        }
      }
    }

    // Insert degrees individually
    for (const item of toInsert) {
      try {
        await Degree.create({
          ...item.data,
          ...(req.user?._id
            ? { createdBy: req.user._id }
            : {}),
        });

        results.push({
          row: item.row,
          status: "success",
          name: item.data.name,
          message: "Degree imported successfully.",
        });
      } catch (error) {
        results.push({
          row: item.row,
          status: "failed",
          name: item.data.name,
          message:
            error.code === 11000
              ? "Duplicate slug or code already exists."
              : error.message || "Failed to import degree.",
        });
      }
    }

    results.sort((a, b) => a.row - b.row);

    const successful = results.filter(
      (item) => item.status === "success"
    ).length;

    const failed = results.filter(
      (item) => item.status === "failed"
    ).length;

    return res.status(200).json({
      status: true,
      message: "Bulk degree import completed.",
      total: degrees.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk Degree Import Error:", error);

    return res.status(500).json({
      status: false,
      message: "Server error while importing degrees.",
      error: error.message,
    });
  }
};

module.exports = BulkDegreeImportController;
