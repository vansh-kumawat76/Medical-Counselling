
const mongoose = require("mongoose");
const { parse } = require("csv-parse/sync");

const Specialization = require("../models/Specialization");
const Course = require("../models/Course");

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const buildCourseLookup = (courses) => {
  const lookup = new Map();

  for (const course of courses) {
    for (const field of ["name", "shortName", "slug", "code"]) {
      const value = normalize(course[field]);

      if (!value) continue;

      if (!lookup.has(value)) {
        lookup.set(value, new Set());
      }

      lookup.get(value).add(String(course._id));
    }
  }

  return lookup;
};

const resolveCourse = (value, lookup, existingIds) => {
  const input = String(value || "").trim();

  if (!input) {
    return { error: "Course is required" };
  }

  if (mongoose.Types.ObjectId.isValid(input)) {
    if (existingIds.has(input)) {
      return { id: input };
    }

    return { error: `Course not found: ${input}` };
  }

  const matches = lookup.get(normalize(input));

  if (!matches || matches.size === 0) {
    return { error: `Course not found: ${input}` };
  }

  if (matches.size > 1) {
    return { error: `Course is ambiguous: ${input}` };
  }

  return { id: [...matches][0] };
};

const parseList = (value) =>
  String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const BulkSpecializationImportController = async (req, res) => {
  try {
    // 1. Check CSV file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: false,
        message: "Please upload a CSV file using the file field",
      });
    }

    // 2. Parse CSV
    let specializations;

    try {
      specializations = parse(req.file.buffer.toString("utf-8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: "Invalid CSV file",
        error: error.message,
      });
    }

    if (!specializations.length) {
      return res.status(400).json({
        status: false,
        message: "CSV file is empty",
      });
    }

    if (specializations.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 specializations can be imported at once",
      });
    }

    // 3. Fetch courses once
    const courses = await Course.find({})
      .select("_id name shortName slug code")
      .lean();

    const courseLookup = buildCourseLookup(courses);

    const courseIds = new Set(
      courses.map((item) => String(item._id))
    );

    const results = [];
    const validItems = [];
    const seenSlugs = new Set();
    const seenCodes = new Set();

    // 4. Validate CSV rows
    for (let i = 0; i < specializations.length; i++) {
      const row = specializations[i];
      const rowNumber = i + 2;
      const errors = [];

      const name = String(row.name || "").trim();
      const slug = String(row.slug || "").trim().toLowerCase();
      const code = String(row.code || "").trim().toUpperCase();
      const description = String(row.description || "").trim();

      const status = String(row.status || "active")
        .trim()
        .toLowerCase();

      const courseResult = resolveCourse(
        row.course,
        courseLookup,
        courseIds
      );

      if (courseResult.error) {
        errors.push(courseResult.error);
      }

      // Duration
      const durationValue =
        row.durationValue === "" || row.durationValue == null
          ? undefined
          : Number(row.durationValue);

      const durationUnit = String(row.durationUnit || "")
        .trim()
        .toLowerCase();

      if (
        durationValue !== undefined &&
        (!Number.isFinite(durationValue) || durationValue < 0)
      ) {
        errors.push("Duration must be a non-negative number");
      }

      if (
        durationValue !== undefined &&
        !["months", "years"].includes(durationUnit)
      ) {
        errors.push("Duration unit must be months or years");
      }

      if (
        durationValue === undefined &&
        durationUnit
      ) {
        errors.push("Duration value is required when duration unit is provided");
      }

      // Eligibility
      const minimumPercentage =
        row.minimumPercentage === "" ||
        row.minimumPercentage == null
          ? undefined
          : Number(row.minimumPercentage);

      if (
        minimumPercentage !== undefined &&
        (
          !Number.isFinite(minimumPercentage) ||
          minimumPercentage < 0 ||
          minimumPercentage > 100
        )
      ) {
        errors.push("Minimum percentage must be between 0 and 100");
      }

      // Required fields
      if (!name) errors.push("Specialization name is required");

      if (!slug) {
        errors.push("Slug is required");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.push("Slug format is invalid");
      }

      if (!["active", "inactive"].includes(status)) {
        errors.push("Status must be active or inactive");
      }

      // Duplicate checks inside CSV
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
          name,
          message: errors.join(", "),
        });

        continue;
      }

      const data = {
        name,
        slug,
        description,
        course: courseResult.id,
        status,
      };

      if (code) data.code = code;

      if (durationValue !== undefined) {
        data.duration = {
          value: durationValue,
          unit: durationUnit,
        };
      }

      const requiredSubjects = parseList(row.requiredSubjects);
      const careerOptions = parseList(row.careerOptions);

      if (
        minimumPercentage !== undefined ||
        requiredSubjects.length ||
        String(row.requiredQualification || "").trim()
      ) {
        data.eligibility = {};

        if (minimumPercentage !== undefined) {
          data.eligibility.minimumPercentage = minimumPercentage;
        }

        if (requiredSubjects.length) {
          data.eligibility.requiredSubjects = requiredSubjects;
        }

        if (String(row.requiredQualification || "").trim()) {
          data.eligibility.requiredQualification =
            String(row.requiredQualification).trim();
        }
      }

      if (careerOptions.length) {
        data.careerOptions = careerOptions;
      }

      if (
        req.user?._id &&
        mongoose.Types.ObjectId.isValid(req.user._id)
      ) {
        data.createdBy = req.user._id;
      }

      validItems.push({
        row: rowNumber,
        data,
      });
    }

    // 5. Stop if no valid records
    if (!validItems.length) {
      return res.status(200).json({
        status: true,
        message: "No valid specializations available for import",
        total: specializations.length,
        successful: 0,
        failed: results.length,
        results,
      });
    }

    // 6. Check duplicates in database
    const duplicateConditions = [
      {
        slug: {
          $in: validItems.map((item) => item.data.slug),
        },
      },
    ];

    const codes = validItems
      .map((item) => item.data.code)
      .filter(Boolean);

    if (codes.length) {
      duplicateConditions.push({
        code: { $in: codes },
      });
    }

    const existing = await Specialization.find({
      $or: duplicateConditions,
    })
      .select("slug code")
      .lean();

    const existingSlugs = new Set(
      existing.map((item) => item.slug)
    );

    const existingCodes = new Set(
      existing.map((item) => item.code).filter(Boolean)
    );

    // 7. Import
    for (const item of validItems) {
      const errors = [];

      if (existingSlugs.has(item.data.slug)) {
        errors.push(`Slug already exists: ${item.data.slug}`);
      }

      if (
        item.data.code &&
        existingCodes.has(item.data.code)
      ) {
        errors.push(`Code already exists: ${item.data.code}`);
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
        await Specialization.create(item.data);

        results.push({
          row: item.row,
          status: "success",
          name: item.data.name,
          message: "Specialization imported successfully",
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
              ? "Slug or code already exists"
              : error.message || "Failed to import specialization",
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
      message: "Bulk specialization import completed",
      total: specializations.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk Specialization Import Error:", error);

    return res.status(500).json({
      status: false,
      message: "Server error while importing specializations",
      error: error.message,
    });
  }
};

module.exports = BulkSpecializationImportController;
