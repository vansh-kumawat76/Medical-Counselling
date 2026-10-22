
const Degree = require("../models/Degree");
const mongoose = require("mongoose");

const BulkDegreeImportController = async (req, res) => {
  try {
    const { degrees } = req.body;

    if (!Array.isArray(degrees) || degrees.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide an array of degrees",
      });
    }

    if (degrees.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 degrees can be imported at once",
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
          message: "Invalid degree data",
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
      const status = String(row.status || "active").trim().toLowerCase();
      const description = String(row.description || "").trim();

      const displayOrder =
        row.displayOrder === "" || row.displayOrder == null
          ? 0
          : Number(row.displayOrder);

      if (!name) errors.push("Name is required");
      if (!shortName) errors.push("Short name is required");

      if (!slug) {
        errors.push("Slug is required");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.push("Slug format is invalid");
      }

      if (!validLevels.includes(level)) {
        errors.push(`Level must be one of: ${validLevels.join(", ")}`);
      }

      if (!validDegreeTypes.includes(degreeType)) {
        errors.push(
          `Degree type must be one of: ${validDegreeTypes.join(", ")}`
        );
      }

      if (!validStatuses.includes(status)) {
        errors.push("Status must be active or inactive");
      }

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        errors.push("Display order must be a non-negative integer");
      }

      let defaultDuration;

      const durationValue = row.durationValue;
      const durationUnit = String(row.durationUnit || "").trim().toLowerCase();

      if (durationValue !== "" && durationValue != null) {
        const value = Number(durationValue);

        if (!Number.isFinite(value) || value < 0) {
          errors.push("Duration value must be a non-negative number");
        } else if (!["months", "years"].includes(durationUnit)) {
          errors.push("Duration unit must be months or years");
        } else {
          defaultDuration = {
            value,
            unit: durationUnit,
          };
        }
      }

      const streamsInput = row.streams;
      let streams = [];

      if (Array.isArray(streamsInput)) {
        streams = streamsInput;
      } else if (typeof streamsInput === "string" && streamsInput.trim()) {
        streams = streamsInput
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }

      for (const streamId of streams) {
        if (!mongoose.Types.ObjectId.isValid(streamId)) {
          errors.push(`Invalid stream ID: ${streamId}`);
          break;
        }
      }

      if (slug && seenSlugs.has(slug)) {
        errors.push("Duplicate slug in this CSV");
      }

      if (code && seenCodes.has(code)) {
        errors.push("Duplicate code in this CSV");
      }

      if (slug) seenSlugs.add(slug);
      if (code) seenCodes.add(code);

      if (errors.length) {
        results.push({
          row: rowNumber,
          status: "failed",
          message: errors.join(", "),
        });
        continue;
      }

      validDegrees.push({
        row: rowNumber,
        data: {
          name,
          shortName,
          slug,
          ...(code ? { code } : {}),
          level,
          degreeType,
          ...(defaultDuration ? { defaultDuration } : {}),
          description,
          streams,
          status,
          displayOrder,
        },
      });
    }

    // Check existing slugs and codes in the database.
    const slugs = validDegrees.map((item) => item.data.slug);
    const codes = validDegrees
      .map((item) => item.data.code)
      .filter(Boolean);

    const existing = await Degree.find({
      $or: [
        { slug: { $in: slugs } },
        ...(codes.length ? [{ code: { $in: codes } }] : []),
      ],
    })
      .select("slug code")
      .lean();

    const existingSlugs = new Set(existing.map((item) => item.slug));
    const existingCodes = new Set(
      existing.map((item) => item.code).filter(Boolean)
    );

    const toInsert = [];

    for (const item of validDegrees) {
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
          message: errors.join(", "),
        });
      } else {
        toInsert.push(item);
      }
    }

    // Insert each degree separately so one duplicate does not reject all rows.
    for (const item of toInsert) {
      try {
        await Degree.create(item.data);

        results.push({
          row: item.row,
          status: "success",
          name: item.data.name,
          message: "Degree imported successfully",
        });
      } catch (error) {
        results.push({
          row: item.row,
          status: "failed",
          name: item.data.name,
          message:
            error.code === 11000
              ? "Duplicate slug or code already exists"
              : error.message || "Failed to import degree",
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
      message: "Bulk degree import completed",
      total: degrees.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk Degree Import Error:", error);

    return res.status(500).json({
      status: false,
      message: "Server error while importing degrees",
      error: error.message,
    });
  }
};

module.exports = BulkDegreeImportController;
