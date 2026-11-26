const University = require("../models/University");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { redisClient } = require("../config/redis");

async function clearUniversityCache() {
  if (!redisClient.isReady) return;

  try {
    const keys = redisClient.scanIterator({
      MATCH: "cache:/university/get-university*",
      COUNT: 100,
    });

    for await (const keyBatch of keys) {
      if (keyBatch.length > 0) {
        await redisClient.del(keyBatch);
      }
    }

    console.log("University Cache Cleared Successfully!");
  } catch (error) {
    console.error("University Cache Clear Error:", error.message);
  }
}

const parseLocation = (location) => {
  if (typeof location !== "string") return location || {};

  try {
    return JSON.parse(location);
  } catch {
    return {};
  }
};

async function createUniversity(req, res) {
  try {
    const { name, shortName, type, establishedYear, location, website } =
      req.body;

    let logo = req.body.logo || "";

    // Upload logo to Cloudinary
    if (req.files?.logo?.[0]) {
      const uploadedLogo = await uploadToCloudinary(req.files.logo[0].buffer);

      logo = uploadedLogo.url;
    }

    const university = new University({
      name,
      shortName,
      logo,
      type,
      establishedYear,
      location: parseLocation(location),
      website,
    });

    await university.save();
    await clearUniversityCache();
    res.status(201).send({
      status: true,
      message: "The university has been created successfully.",
      university,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: "We couldn't create the university. Please try again later.",
      error: error.message,
    });
  }
}


async function GetUniversity(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { shortName: { $regex: escapedSearch, $options: "i" } },
        { type: { $regex: escapedSearch, $options: "i" } },
        { "location.city": { $regex: escapedSearch, $options: "i" } },
        { "location.state": { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [universities, totalUniversities] = await Promise.all([
      University.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),

      University.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUniversities / limit);

    res.status(200).send({
      status: true,
      message: "University records retrieved successfully.",
      universities,
      pagination: {
        currentPage: page,
        limit,
        totalUniversities,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message,
    });
  }
}


async function updateUniversity(req, res) {
  try {
    const university = await University.findById(req.params.id);

    if (!university) {
      return res.status(404).send({
        message: "The requested university could not be found.",
      });
    }

    let logo = university.logo || "";

    // Upload new logo if selected
    if (req.files?.logo?.[0]) {
      const uploadedLogo = await uploadToCloudinary(req.files.logo[0].buffer);

      logo = uploadedLogo.url;
    } else if (req.body.logo !== undefined) {
      logo = req.body.logo;
    }

    const updatedUniversity = await University.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        location: parseLocation(req.body.location),
        logo,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    await clearUniversityCache();
    res.status(200).send({
      message: "University details have been updated successfully.",
      university: updatedUniversity,
    });
  } catch (error) {
    res.status(500).send({
      message: "We couldn't update the university. Please try again later.",
      error: error.message,
    });
  }
}

async function deleteUniversity(req, res) {
  try {
    const deletedUniversity = await University.findByIdAndDelete(req.params.id);

    if (!deletedUniversity) {
      return res.status(404).send({
        message: "The requested university could not be found.",
      });
    }
    await clearUniversityCache();
    res.status(200).send({
      message: "The university has been deleted successfully.",
    });
  } catch (error) {
    res.status(500).send({
      message: "We couldn't delete the university. Please try again later.",
      error: error.message,
    });
  }
}

module.exports = {
  createUniversity,
  GetUniversity,
  updateUniversity,
  deleteUniversity,
};
