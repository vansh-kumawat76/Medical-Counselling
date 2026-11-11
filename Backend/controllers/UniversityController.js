
const University = require("../models/University")
const uploadToCloudinary = require("../utils/uploadToCloudinary");

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
    const {
      name,
      shortName,
      type,
      establishedYear,
      location,
      website,
    } = req.body;

    let logo = req.body.logo || "";

    // Upload logo to Cloudinary
    if (req.files?.logo?.[0]) {
      const uploadedLogo = await uploadToCloudinary(
        req.files.logo[0].buffer
      );

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
    const getUniversity = await University.find()
      .sort({
        createdAt: -1,
        _id: -1,
      });

    res.status(200).send({
      status: true,
      message: "University records retrieved successfully.",
      universities: getUniversity,
    });
  } catch (error) {
    console.error("Get University Error:", error);

    res.status(500).send({
      status: false,
      message: "We couldn't retrieve the university records. Please try again later.",
      error: error.message,
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
      const uploadedLogo = await uploadToCloudinary(
        req.files.logo[0].buffer
      );

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
      }
    );

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
    const deletedUniversity = await University.findByIdAndDelete(
      req.params.id
    );

    if (!deletedUniversity) {
      return res.status(404).send({
        message: "The requested university could not be found.",
      });
    }

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
  deleteUniversity
};
