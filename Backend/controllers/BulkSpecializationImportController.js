
const mongoose = require("mongoose");
const Specialization = require("../models/Specialization");
const Course = require("../models/Course");

const BulkSpecializationImportController = async (req, res) => {
  try {
    const { specializations } = req.body;

    if (!Array.isArray(specializations) || specializations.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Specializations array is required",
      });
    }

    if (specializations.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 specializations can be imported at once",
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < specializations.length; i++) {
      const item = specializations[i];

      try {
        if (
          !item ||
          typeof item.name !== "string" ||
          !item.name.trim() ||
          typeof item.slug !== "string" ||
          !item.slug.trim() ||
          !item.course
        ) {
          throw new Error("Name, slug and course are required");
        }

        if (!mongoose.Types.ObjectId.isValid(item.course)) {
          throw new Error("Valid Course ID is required");
        }

        const courseExists = await Course.findById(item.course);

        if (!courseExists) {
          throw new Error("Course not found");
        }

        const slug = item.slug.trim().toLowerCase();
        const code =
          typeof item.code === "string"
            ? item.code.trim().toUpperCase()
            : undefined;

        if (item.status && !["active", "inactive"].includes(item.status)) {
          throw new Error("Status must be active or inactive");
        }

        const duplicateConditions = [{ slug }];

        if (code) {
          duplicateConditions.push({ code });
        }

        const duplicate = await Specialization.findOne({
          $or: duplicateConditions,
        });

        if (duplicate) {
          throw new Error("Slug or code already exists");
        }

        const specialization = await Specialization.create({
          name: item.name.trim(),
          slug,
          code: code || undefined,
          description: item.description || "",
          course: item.course,
          duration: item.duration,
          eligibility: item.eligibility,
          careerOptions: item.careerOptions,
          status: item.status || "active",
          createdBy: req.user?._id,
        });

        successful++;

        results.push({
          row: i + 1,
          status: "success",
          name: specialization.name,
          message: "Specialization imported successfully",
        });
      } catch (error) {
        failed++;

        results.push({
          row: i + 1,
          status: "failed",
          name: item?.name || "",
          message:
            error.code === 11000
              ? "Slug or code already exists"
              : error.message,
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: "Bulk specialization import completed",
      total: specializations.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = BulkSpecializationImportController;
