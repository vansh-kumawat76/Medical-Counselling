
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Degree = require("../models/Degree");
const Stream = require("../models/Stream");

const BulkCourseImportController = async (req, res) => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide an array of courses",
      });
    }

    if (courses.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 courses can be imported at once",
      });
    }

    const results = [];
    const validCourses = [];
    const seenSlugs = new Set();
    const seenCodes = new Set();
    const validStatuses = ["active", "inactive"];

    for (let i = 0; i < courses.length; i++) {
      const row = courses[i];
      const rowNumber = i + 1;
      const errors = [];

      if (!row || typeof row !== "object" || Array.isArray(row)) {
        results.push({
          row: rowNumber,
          status: "failed",
          message: "Invalid course data",
        });
        continue;
      }

      const name = String(row.name || "").trim();
      const shortName = String(row.shortName || "").trim();
      const slug = String(row.slug || "").trim().toLowerCase();
      const code = String(row.code || "").trim().toUpperCase();
      const description = String(row.description || "").trim();
      const status = String(row.status || "active").trim().toLowerCase();

      const degree = String(row.degree || "").trim();
      const stream = String(row.stream || "").trim();

      const durationValue =
        row.durationValue === "" || row.durationValue == null
          ? undefined
          : Number(row.durationValue);

      const durationUnit = String(
        row.durationUnit || "years"
      ).trim().toLowerCase();

      const displayOrder =
        row.displayOrder === "" || row.displayOrder == null
          ? 0
          : Number(row.displayOrder);

      if (!name) errors.push("Course name is required");

      if (!slug) {
        errors.push("Slug is required");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.push("Slug format is invalid");
      }

      if (!degree || !mongoose.Types.ObjectId.isValid(degree)) {
        errors.push("Valid Degree ID is required");
      }

      if (!stream || !mongoose.Types.ObjectId.isValid(stream)) {
        errors.push("Valid Stream ID is required");
      }

      if (
        durationValue !== undefined &&
        (!Number.isFinite(durationValue) || durationValue < 0)
      ) {
        errors.push("Duration must be a non-negative number");
      }

      if (!["months", "years"].includes(durationUnit)) {
        errors.push("Duration unit must be months or years");
      }

      if (!validStatuses.includes(status)) {
        errors.push("Status must be active or inactive");
      }

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        errors.push("Display order must be a non-negative integer");
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

      validCourses.push({
        row: rowNumber,
        data: {
          name,
          shortName,
          slug,
          ...(code ? { code } : {}),
          degree,
          stream,
          ...(durationValue !== undefined
            ? {
                duration: {
                  value: durationValue,
                  unit: durationUnit,
                },
              }
            : {}),
          description,
          status,
          displayOrder,
        },
      });
    }

    // Check whether referenced degrees and streams actually exist.
    const degreeIds = [
      ...new Set(validCourses.map((item) => item.data.degree)),
    ];

    const streamIds = [
      ...new Set(validCourses.map((item) => item.data.stream)),
    ];

    const [existingDegrees, existingStreams] = await Promise.all([
      Degree.find({ _id: { $in: degreeIds } }).select("_id").lean(),
      Stream.find({ _id: { $in: streamIds } }).select("_id").lean(),
    ]);

    const degreeSet = new Set(existingDegrees.map((item) => String(item._id)));
    const streamSet = new Set(existingStreams.map((item) => String(item._id)));

    const checkedCourses = [];

    for (const item of validCourses) {
      const errors = [];

      if (!degreeSet.has(item.data.degree)) {
        errors.push(`Degree not found: ${item.data.degree}`);
      }

      if (!streamSet.has(item.data.stream)) {
        errors.push(`Stream not found: ${item.data.stream}`);
      }

      if (errors.length) {
        results.push({
          row: item.row,
          status: "failed",
          message: errors.join(", "),
        });
      } else {
        checkedCourses.push(item);
      }
    }

    // Check existing slugs and codes in the database.
    const slugs = checkedCourses.map((item) => item.data.slug);
    const codes = checkedCourses
      .map((item) => item.data.code)
      .filter(Boolean);

    const existingCourses = await Course.find({
      $or: [
        { slug: { $in: slugs } },
        ...(codes.length ? [{ code: { $in: codes } }] : []),
      ],
    })
      .select("slug code")
      .lean();

    const existingSlugs = new Set(
      existingCourses.map((item) => item.slug)
    );

    const existingCodes = new Set(
      existingCourses.map((item) => item.code).filter(Boolean)
    );

    for (const item of checkedCourses) {
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
        continue;
      }

      try {
        await Course.create(item.data);

        results.push({
          row: item.row,
          status: "success",
          name: item.data.name,
          message: "Course imported successfully",
        });
      } catch (error) {
        results.push({
          row: item.row,
          status: "failed",
          name: item.data.name,
          message:
            error.code === 11000
              ? "Duplicate slug or code already exists"
              : error.message || "Failed to import course",
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
      message: "Bulk course import completed",
      total: courses.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk Course Import Error:", error);

    return res.status(500).json({
      status: false,
      message: "Server error while importing courses",
      error: error.message,
    });
  }
};

module.exports = BulkCourseImportController;
