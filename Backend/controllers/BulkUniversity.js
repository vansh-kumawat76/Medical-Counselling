
const University = require("../models/University");

const BulkUniversityImportController = async (req, res) => {
  try {
    const { universities } = req.body;

    if (!Array.isArray(universities) || universities.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide valid university data for import.",
      });
    }

    if (universities.length > 500) {
      return res.status(400).json({
        status: false,
        message: "You can import a maximum of 500 universities at a time.",
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
          throw new Error("Please provide both the university name and short name.");
        }

        if (importedShortNames.has(shortName)) {
          throw new Error("This short name is duplicated within the import file.");
        }

        const existingUniversity = await University.findOne({ shortName });

        if (existingUniversity) {
          throw new Error("A university with this short name already exists.");
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
          message: "The university has been created successfully.",
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
      message: "The bulk university import process has been completed.",
      total: universities.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk university import error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to complete the bulk university import. Please try again later.",
    });
  }
};

module.exports = BulkUniversityImportController;
