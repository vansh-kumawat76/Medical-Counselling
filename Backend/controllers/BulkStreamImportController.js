
const Stream = require("../models/Stream");

const BulkStreamImportController = async (req, res) => {
  try {
    const { streams } = req.body;

    // 1. Validate request data
    if (!Array.isArray(streams) || streams.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide valid stream data for import.",
      });
    }

    // 2. Maximum 500 records
    if (streams.length > 500) {
      return res.status(400).json({
        status: false,
        message: "You can import a maximum of 500 streams at a time.",
      });
    }

    const validStreamTypes = [
      "government",
      "private",
      "deemed",
      "autonomous",
      "public",
    ];

    const validStatuses = ["active", "inactive", "pending"];

    const results = [];
    const importedSlugs = new Set();
    const importedCodes = new Set();

    let successful = 0;
    let failed = 0;

    // 3. Process each stream
    for (let i = 0; i < streams.length; i++) {
      const row = streams[i];

      try {
        if (!row || typeof row !== "object" || Array.isArray(row)) {
          throw new Error("Please provide valid stream data.");
        }

        const name =
          typeof row.name === "string" ? row.name.trim() : "";

        const slug =
          typeof row.slug === "string"
            ? row.slug.trim().toLowerCase()
            : "";

        const code =
          typeof row.code === "string"
            ? row.code.trim().toUpperCase()
            : "";

        const streamType =
          typeof row.streamType === "string"
            ? row.streamType.trim().toLowerCase()
            : "";

        const description =
          typeof row.description === "string"
            ? row.description.trim()
            : "";

        // 4. Required fields
        if (!name) {
          throw new Error("Please provide the stream name.");
        }

        if (!slug) {
          throw new Error("Please provide the stream slug.");
        }

        if (!validStreamTypes.includes(streamType)) {
          throw new Error(
            `Please provide a valid stream type. Allowed values: ${validStreamTypes.join(", ")}.`
          );
        }

        // 5. Validate slug format
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          throw new Error(
            "The slug can contain only lowercase letters, numbers, and hyphens."
          );
        }

        // 6. Check duplicate values inside this CSV
        if (importedSlugs.has(slug)) {
          throw new Error(`The slug "${slug}" is duplicated in the uploaded data.`);
        }

        if (code && importedCodes.has(code)) {
          throw new Error(`The code "${code}" is duplicated in the uploaded data.`);
        }

        // 7. Check duplicate values in database
        const duplicateConditions = [{ slug }];

        if (code) {
          duplicateConditions.push({ code });
        }

        const existingStream = await Stream.findOne({
          $or: duplicateConditions,
        }).lean();

        if (existingStream) {
          if (existingStream.slug === slug) {
            throw new Error(`The slug "${slug}" already exists.`);
          }

          if (
            code &&
            existingStream.code &&
            existingStream.code === code
          ) {
            throw new Error(`The code "${code}" already exists.`);
          }
        }

        // 8. Validate optional numeric fields
        let displayOrder = 0;

        if (
          row.displayOrder !== undefined &&
          row.displayOrder !== null &&
          row.displayOrder !== ""
        ) {
          displayOrder = Number(row.displayOrder);

          if (
            !Number.isInteger(displayOrder) ||
            displayOrder < 0
          ) {
            throw new Error(
              "The display order must be a non-negative integer."
            );
          }
        }

        let parentStream = null;

        if (
          row.parentStream !== undefined &&
          row.parentStream !== null &&
          String(row.parentStream).trim() !== ""
        ) {
          const parentId = String(row.parentStream).trim();

          if (!require("mongoose").isValidObjectId(parentId)) {
            throw new Error("Please provide a valid parent stream ID.");
          }

          const parentExists = await Stream.exists({ _id: parentId });

          if (!parentExists) {
            throw new Error("The selected parent stream could not be found.");
          }

          parentStream = parentId;
        }

        let status = "pending";

        if (row.status !== undefined && row.status !== "") {
          status =
            typeof row.status === "string"
              ? row.status.trim().toLowerCase()
              : "";

          if (!validStatuses.includes(status)) {
            throw new Error(
              `Please provide a valid status. Allowed values: ${validStatuses.join(", ")}.`
            );
          }
        }

        let isVerified = false;

        if (row.isVerified !== undefined && row.isVerified !== "") {
          if (typeof row.isVerified === "boolean") {
            isVerified = row.isVerified;
          } else if (
            ["true", "1"].includes(
              String(row.isVerified).trim().toLowerCase()
            )
          ) {
            isVerified = true;
          } else if (
            ["false", "0"].includes(
              String(row.isVerified).trim().toLowerCase()
            )
          ) {
            isVerified = false;
          } else {
            throw new Error(
              "The verification status must be true, false, 1, or 0."
            );
          }
        }

        // 9. Prepare stream document
        const streamData = {
          name,
          slug,
          code: code || undefined,
          description,
          icon: row.icon || null,
          image: row.image || null,
          logo: row.logo || null,
          streamType,
          parentStream,
          displayOrder,
          status,
          isVerified,
        };

        // 10. Create stream
        const createdStream = await Stream.create(streamData);

        importedSlugs.add(slug);

        if (code) {
          importedCodes.add(code);
        }

        successful++;

        results.push({
          row: i + 1,
          status: "success",
          message: "The stream has been imported successfully.",
          stream: {
            _id: createdStream._id,
            name: createdStream.name,
            slug: createdStream.slug,
            code: createdStream.code,
          },
        });
      } catch (error) {
        failed++;

        results.push({
          row: i + 1,
          status: "failed",
          message:
            error.code === 11000
              ? "A stream with this slug or code already exists."
              : error.message || "Unable to import the stream.",
        });
      }
    }

    // 11. Return import summary
    return res.status(200).json({
      status: true,
      message: "The bulk stream import process has been completed.",
      total: streams.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk Stream Import Error:", error);

    return res.status(500).json({
      status: false,
      message: "An internal server error occurred during the bulk stream import.",
    });
  }
};

module.exports = BulkStreamImportController;
