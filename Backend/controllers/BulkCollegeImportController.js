const Colleges = require("../models/Colleges");

const BulkCollegeImportController = async (req, res) => {
  try {
    const { colleges } = req.body;

    if (!Array.isArray(colleges) || colleges.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide colleges data.",
      });
    }

    if (colleges.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 colleges can be imported at once.",
      });
    }

    const results = [];
    const importedSlugs = new Set();

    for (let i = 0; i < colleges.length; i++) {
      const row = colleges[i];

      try {
        const name = String(row.name || "").trim();
        const slug = String(row.slug || "").trim().toLowerCase();

        if (!name || !slug) {
          throw new Error("College name and slug are required.");
        }

        if (importedSlugs.has(slug)) {
          throw new Error("Duplicate slug in this import file.");
        }

        const existingCollege = await Colleges.findOne({ slug });

        if (existingCollege) {
          throw new Error("College with this slug already exists.");
        }

        const collegeData = {
          name,
          slug,
          description: row.description,
          university: row.university,
          collegeType: row.collegeType,
          ownership: row.ownership,
          establishedYear: row.establishedYear,
          location: row.location,
          website: row.website,
          contact: row.contact,
          accreditation: row.accreditation,
          ranking: row.ranking,
          rating: row.rating,
          facilities: row.facilities,
          isVerified: row.isVerified,
          status: row.status,
        };

        // Remove undefined values so schema defaults can apply.
        Object.keys(collegeData).forEach((key) => {
          if (collegeData[key] === undefined) {
            delete collegeData[key];
          }
        });

        const college = await Colleges.create(collegeData);

        importedSlugs.add(slug);

        results.push({
          row: i + 1,
          name,
          slug,
          status: "success",
          collegeId: college._id,
          message: "College created successfully.",
        });
      } catch (rowError) {
        results.push({
          row: i + 1,
          name: row.name || "",
          slug: row.slug || "",
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
      message: "Bulk college import completed.",
      total: colleges.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk college import error:", error);

    return res.status(500).json({
      status: false,
      message: "Bulk college import failed.",
    });
  }
};

module.exports = BulkCollegeImportController;
