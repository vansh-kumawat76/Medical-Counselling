
const University = require("../models/University");

const BulkUniversityImportController = async (req, res) => {
  try {
    const { universities } = req.body;

    if (!Array.isArray(universities) || universities.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide university data.",
      });
    }

    if (universities.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 universities can be imported at once.",
      });
    }

    const results = [];
    const importedShortNames = new Set();

    for (let i = 0; i < universities.length; i++) {
      const row = universities[i];

      try {
        const name = String(row.name || "").trim();
        const shortName = String(row.shortName || "")
          .trim()
          .toUpperCase();

        if (!name || !shortName) {
          throw new Error("University name and short name are required.");
        }

        if (importedShortNames.has(shortName)) {
          throw new Error("Duplicate short name in this import file.");
        }

        const existingUniversity = await University.findOne({ shortName });

        if (existingUniversity) {
          throw new Error("University with this short name already exists.");
        }

        const universityData = {
          name,
          shortName,
          logo: row.logo,
          type: row.type,
          establishedYear: row.establishedYear,
          location: row.location,
          website: row.website,
        };

        Object.keys(universityData).forEach((key) => {
          if (universityData[key] === undefined) {
            delete universityData[key];
          }
        });

        const university = await University.create(universityData);

        importedShortNames.add(shortName);

        results.push({
          row: i + 1,
          name,
          shortName,
          status: "success",
          universityId: university._id,
          message: "University created successfully.",
        });
      } catch (rowError) {
        results.push({
          row: i + 1,
          name: row.name || "",
          shortName: row.shortName || "",
          status: "failed",
          message: rowError.message,
        });
      }
    }

    const successful = results.filter(
      (item) => item.status === "success"
    ).length;

    const failed = results.length - successful;

    return res.status(200).json({
      status: true,
      message: "Bulk university import completed.",
      total: universities.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk university import error:", error);

    return res.status(500).json({
      status: false,
      message: "Bulk university import failed.",
    });
  }
};

module.exports = BulkUniversityImportController;
