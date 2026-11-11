
const College = require("../models/Colleges");
const University = require("../models/University");
const csv = require("csv-parser");
const { Readable } = require("stream");

// Parse Boolean
const parseBoolean = (value) => {
  if (!value?.trim()) return undefined;

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) return true;

  if (["false", "0", "no"].includes(normalized)) return false;

  throw new Error(`Invalid boolean value: ${value}`);
};

// Parse JSON
const parseJSON = (value, fieldName) => {
  if (!value?.trim()) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${fieldName} must contain valid JSON.`);
  }
};

// Validate JSON Object
const validateObject = (value, fieldName) => {
  if (value === undefined) return;

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(`${fieldName} must be a valid JSON object.`);
  }
};

// Validate JSON Array
const validateArray = (value, fieldName) => {
  if (value === undefined) return;

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be a valid JSON array.`);
  }

  value.forEach((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      throw new Error(
        `${fieldName}[${index}] must be a valid object.`
      );
    }
  });
};

// Validate Numeric Values
const validateNumericField = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return;

  if (!Number.isFinite(Number(value))) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
};

// Validate Nested Numeric Fields
const validateCollegeJSON = ({
  location,
  contact,
  accreditation,
  ranking,
  rating
}) => {
  validateObject(location, "location");
  validateObject(contact, "contact");
  validateObject(rating, "rating");

  validateArray(accreditation, "accreditation");
  validateArray(ranking, "ranking");

  if (rating) {
    validateNumericField(rating.average, "rating.average");
    validateNumericField(rating.count, "rating.count");
  }

  accreditation?.forEach((item, index) => {
    validateNumericField(
      item.year,
      `accreditation[${index}].year`
    );
  });

  ranking?.forEach((item, index) => {
    validateNumericField(
      item.rank,
      `ranking[${index}].rank`
    );

    validateNumericField(
      item.year,
      `ranking[${index}].year`
    );
  });
};

// Create Slug
const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Main Controller
const BulkCollegeImportController = async (req, res) => {
  try {
    // Check CSV File
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file.",
      });
    }

    // Parse CSV
    let colleges;

    try {
      colleges = await new Promise((resolve, reject) => {
        const results = [];

        Readable.from([req.file.buffer])
          .pipe(
            csv({
              mapHeaders: ({ header }) =>
                header
                  .replace(/^\uFEFF/, "")
                  .trim()
                  .toLowerCase()
            })
          )
          .on("data", (row) => {
            results.push(row);
          })
          .on("end", () => {
            resolve(results);
          })
          .on("error", reject);
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "The uploaded CSV file could not be parsed.",
        error: error.message
      });
    }

    // Validate CSV Data
    if (!colleges.length) {
      return res.status(400).json({
        success: false,
        message: "The uploaded CSV file does not contain any college records."
      });
    }

    // Validate CSV Headers
    const requiredHeaders = ["name", "university"];

    const csvHeaders = Object.keys(colleges[0]);

    const missingHeaders = requiredHeaders.filter(
      (header) => !csvHeaders.includes(header)
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "The CSV file is missing one or more required columns.",
        missingHeaders
      });
    }

    // Import Counters
    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const skippedRows = [];
    const failedRows = [];

    // Import Colleges
    for (let index = 0; index < colleges.length; index++) {
      const college = colleges[index];
      const rowNumber = index + 2;

      try {
        // Required Fields
        if (!college.name?.trim()) {
          throw new Error("Please provide the college name.");
        }

        if (!college.university?.trim()) {
          throw new Error("Please provide the university name.");
        }

        // Validate College Type
        const collegeType = college.collegeType
          ?.trim()
          .toLowerCase();

        const allowedTypes = [
          "government",
          "private",
          "deemed",
          "autonomous",
          "public"
        ];

        if (collegeType && !allowedTypes.includes(collegeType)) {
          throw new Error(`The college type "${collegeType}" is invalid.`);
        }

        // Validate Status
        const status = college.status?.trim().toLowerCase();

        const allowedStatuses = [
          "active",
          "inactive",
          "pending"
        ];

        if (status && !allowedStatuses.includes(status)) {
          throw new Error(`The status "${status}" is invalid.`);
        }

        // Parse JSON Fields
        const location = parseJSON(college.location, "location");
        const contact = parseJSON(college.contact, "contact");

        const accreditation = parseJSON(
          college.accreditation,
          "accreditation"
        );

        const ranking = parseJSON(college.ranking, "ranking");
        const rating = parseJSON(college.rating, "rating");

        // Validate JSON Structures and Numeric Fields
        validateCollegeJSON({
          location,
          contact,
          accreditation,
          ranking,
          rating
        });

        // Parse Boolean
        const isVerified = parseBoolean(college.isVerified);

        // Find University
        const universityData = await University.findOne({
          name: college.university.trim()
        });

        if (!universityData) {
          skippedCount++;

          skippedRows.push({
            row: rowNumber,
            college: college.name.trim(),
            reason: "The specified university could not be found."
          });

          continue;
        }

        // Check Existing College
        const collegeName = college.name.trim();

        const existingCollege = await College.findOne({
          name: collegeName
        });

        if (existingCollege) {
          skippedCount++;

          skippedRows.push({
            row: rowNumber,
            college: collegeName,
            reason: "A college with this name already exists."
          });

          continue;
        }

        // Generate Slug
        const slug = createSlug(collegeName);

        if (!slug) {
          throw new Error(
            "Unable to generate a valid slug from the college name."
          );
        }

        // Check Existing Slug
        const existingSlug = await College.findOne({ slug });

        if (existingSlug) {
          skippedCount++;

          skippedRows.push({
            row: rowNumber,
            college: collegeName,
            reason: "A college with this slug already exists."
          });

          continue;
        }

        // Prepare College Data
        const collegeData = {
          name: collegeName,
          slug,
          university: universityData._id,

          collegeType,

          ownership: college.ownership?.trim(),
          establishedYear: college.establishedYear?.trim(),

          location,
          contact,

          website: college.website?.trim(),
          description: college.description?.trim(),

          logo: college.logo?.trim(),
          backgroundImage: college.backgroundImage?.trim(),

          accreditation,
          ranking,
          rating,

          isVerified,
          status
        };

        // Create College
        await College.create(collegeData);

        importedCount++;

      } catch (error) {
        failedCount++;

        failedRows.push({
          row: rowNumber,
          college: college.name?.trim() || "Unknown",
          reason: error.message
        });
      }
    }

    // Final Response
    return res.status(200).json({
      success: true,
      message: "The bulk college import process has been completed.",

      summary: {
        total: colleges.length,
        imported: importedCount,
        skipped: skippedCount,
        failed: failedCount
      },

      skippedRows,
      failedRows
    });

  } catch (error) {
    console.error(
      "Bulk College Import Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while importing colleges.",
      error: error.message
    });
  }
};

module.exports = BulkCollegeImportController;
