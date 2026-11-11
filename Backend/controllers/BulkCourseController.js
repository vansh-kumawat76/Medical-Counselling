
const mongoose = require("mongoose");
const { parse } = require("csv-parse/sync");

const Course = require("../models/Course");
const Degree = require("../models/Degree");
const Stream = require("../models/Stream");

// Normalize names for case-insensitive matching
const normalize = (value) => String(value || "").trim().toLowerCase();

// Build lookup using name, shortName, slug and code
const buildLookup = (records, fields) => {
  const lookup = new Map();

  for (const record of records) {
    for (const field of fields) {
      const value = normalize(record[field]);

      if (!value) continue;

      if (!lookup.has(value)) {
        lookup.set(value, new Set());
      }

      lookup.get(value).add(String(record._id));
    }
  }

  return lookup;
};

const resolveReference = (value, lookup, existingIds, label) => {
  const input = String(value || "").trim();

  if (!input) {
    return { error: `Please provide the ${label.toLowerCase()}.` };
  }

  // Direct ObjectId support
  if (mongoose.Types.ObjectId.isValid(input)) {
    if (existingIds.has(input)) {
      return { id: input };
    }

    return { error: `The ${label.toLowerCase()} with ID "${input}" could not be found.` };
  }

  // Remove CSV prefixes
  let searchValue = input;

  if (label === "Degree") {
    searchValue = input.replace(/^DEGREE_/i, "");
  }

  if (label === "Stream") {
    searchValue = input.replace(/^STREAM_/i, "");
  }

  // Special alias
  if (
    label === "Stream" &&
    normalize(searchValue) === "medical"
  ) {
    searchValue = "medical science";
  }

  const matches = lookup.get(normalize(searchValue));

  if (!matches || matches.size === 0) {
    return { error: `The ${label.toLowerCase()} "${input}" could not be found.` };
  }

  if (matches.size > 1) {
    return { error: `The ${label.toLowerCase()} "${input}" matches multiple records. Please provide a unique identifier.` };
  }

  return { id: [...matches][0] };
};

const BulkCourseImportController = async (req, res) => {
  try {
    // 1. Check CSV file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: false,
        message: "Please upload a CSV file using the 'file' field.",
      });
    }

    // 2. Parse CSV
    let courses;

    try {
      courses = parse(req.file.buffer.toString("utf-8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: "The uploaded CSV file is invalid or could not be parsed.",
        error: error.message,
      });
    }

    if (!courses.length) {
      return res.status(400).json({
        status: false,
        message: "The uploaded CSV file is empty.",
      });
    }

    if (courses.length > 500) {
      return res.status(400).json({
        status: false,
        message: "You can import a maximum of 500 courses at a time.",
      });
    }

    // 3. Fetch Degree and Stream records once
    const [degrees, streams] = await Promise.all([
      Degree.find({})
        .select("_id name shortName slug code")
        .lean(),

      Stream.find({})
        .select("_id name slug code")
        .lean(),
    ]);

    const degreeLookup = buildLookup(degrees, [
      "name",
      "shortName",
      "slug",
      "code",
    ]);

    const streamLookup = buildLookup(streams, [
      "name",
      "slug",
      "code",
    ]);

    const degreeIds = new Set(
      degrees.map((item) => String(item._id))
    );

    const streamIds = new Set(
      streams.map((item) => String(item._id))
    );

    const results = [];
    const validCourses = [];
    const seenSlugs = new Set();
    const seenCodes = new Set();

    // 4. Validate CSV rows
    for (let i = 0; i < courses.length; i++) {
      const row = courses[i];
      const rowNumber = i + 2;
      const errors = [];

      const name = String(row.name || "").trim();
      const shortName = String(row.shortName || "").trim();
      const slug = String(row.slug || "").trim().toLowerCase();
      const code = String(row.code || "").trim().toUpperCase();
      const description = String(row.description || "").trim();

      const status = String(row.status || "active")
        .trim()
        .toLowerCase();

      const durationValue =
        row.durationValue === "" || row.durationValue == null
          ? undefined
          : Number(row.durationValue);

      const durationUnit = String(row.durationUnit || "years")
        .trim()
        .toLowerCase();

      const displayOrder =
        row.displayOrder === "" || row.displayOrder == null
          ? 0
          : Number(row.displayOrder);

      // Resolve Degree and Stream by name or ID
      const degreeResult = resolveReference(
        row.degree,
        degreeLookup,
        degreeIds,
        "Degree"
      );

      const streamResult = resolveReference(
        row.stream,
        streamLookup,
        streamIds,
        "Stream"
      );

      if (degreeResult.error) errors.push(degreeResult.error);
      if (streamResult.error) errors.push(streamResult.error);

      // Required fields
      if (!name) errors.push("Please provide the course name.");

      if (!slug) {
        errors.push("Please provide the course slug.");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.push("Please provide a valid slug using lowercase letters, numbers, and hyphens only.");
      }

      if (durationValue === undefined) {
        errors.push("Please provide the course duration value.");
      } else if (
        !Number.isFinite(durationValue) ||
        durationValue < 0
      ) {
        errors.push("The duration must be a non-negative number.");
      }

      if (!["months", "years"].includes(durationUnit)) {
        errors.push("The duration unit must be either 'months' or 'years'.");
      }

      if (!["active", "inactive"].includes(status)) {
        errors.push("The status must be either 'active' or 'inactive'.");
      }

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        errors.push("The display order must be a non-negative integer.");
      }

      // Duplicate checks inside CSV
      if (slug && seenSlugs.has(slug)) {
        errors.push("This slug is duplicated within the CSV file.");
      }

      if (code && seenCodes.has(code)) {
        errors.push("This code is duplicated within the CSV file.");
      }

      if (slug) seenSlugs.add(slug);
      if (code) seenCodes.add(code);

      if (errors.length) {
        results.push({
          row: rowNumber,
          status: "failed",
          name,
          message: errors.join(", "),
        });

        continue;
      }

      const courseData = {
        name,
        shortName,
        slug,
        degree: degreeResult.id,
        stream: streamResult.id,
        duration: {
          value: durationValue,
          unit: durationUnit,
        },
        description,
        status,
        displayOrder,
      };

      if (code) {
        courseData.code = code;
      }

      if (
        req.user?._id &&
        mongoose.Types.ObjectId.isValid(req.user._id)
      ) {
        courseData.createdBy = req.user._id;
      }

      validCourses.push({
        row: rowNumber,
        data: courseData,
      });
    }

    // 5. Stop if no valid records
    if (validCourses.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No valid course records are available for import.",
        total: courses.length,
        successful: 0,
        failed: results.length,
        results,
      });
    }

    // 6. Check duplicate slugs and codes in database
    const slugs = validCourses.map((item) => item.data.slug);

    const codes = validCourses
      .map((item) => item.data.code)
      .filter(Boolean);

    const duplicateConditions = [];

    if (slugs.length) {
      duplicateConditions.push({
        slug: { $in: slugs },
      });
    }

    if (codes.length) {
      duplicateConditions.push({
        code: { $in: codes },
      });
    }

    const existingCourses = duplicateConditions.length
      ? await Course.find({
          $or: duplicateConditions,
        })
          .select("slug code")
          .lean()
      : [];

    const existingSlugs = new Set(
      existingCourses.map((item) => item.slug)
    );

    const existingCodes = new Set(
      existingCourses.map((item) => item.code).filter(Boolean)
    );

    // 7. Import valid courses
    for (const item of validCourses) {
      const errors = [];

      if (existingSlugs.has(item.data.slug)) {
        errors.push(`The slug "${item.data.slug}" already exists.`);
      }

      if (
        item.data.code &&
        existingCodes.has(item.data.code)
      ) {
        errors.push(`The code "${item.data.code}" already exists.`);
      }

      if (errors.length) {
        results.push({
          row: item.row,
          status: "failed",
          name: item.data.name,
          message: errors.join(", "),
        });

        continue;
      }

      try {
        await Course.create(item.data);

        results.push({
          row: item.row,
          status: "success",
          name: item.data.name,
          message: "The course has been imported successfully.",
        });

        existingSlugs.add(item.data.slug);

        if (item.data.code) {
          existingCodes.add(item.data.code);
        }
      } catch (error) {
        results.push({
          row: item.row,
          status: "failed",
          name: item.data.name,
          message:
            error.code === 11000
              ? "A course with this slug or code already exists."
              : error.message || "Unable to import the course.",
        });
      }
    }

    // 8. Final response
    results.sort((a, b) => a.row - b.row);

    const successful = results.filter(
      (item) => item.status === "success"
    ).length;

    const failed = results.filter(
      (item) => item.status === "failed"
    ).length;

    return res.status(200).json({
      status: true,
      message: "The bulk course import process has been completed.",
      total: courses.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk Course Import Error:", error);

    return res.status(500).json({
      status: false,
      message: "An internal server error occurred while importing courses.",
      error: error.message,
    });
  }
};

module.exports = BulkCourseImportController;
