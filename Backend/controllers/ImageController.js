
const HomePageImage = require("../models/Image");

async function SaveImageController(req, res) {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        status: false,
        message: "Please provide an image URL.",
      });
    }

    const image = await HomePageImage.create({ imageUrl });

    return res.status(201).json({
      status: true,
      message: "The image URL has been saved successfully.",
      data: image,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function GetImageController(req, res) {
  try {
    const image = await HomePageImage.findOne().sort({
      createdAt: -1,
    });

    if (!image) {
      return res.status(404).json({
        status: false,
        message: "No home page image was found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The home page image has been retrieved successfully.",
      data: image,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

module.exports = {
  SaveImageController,
  GetImageController,
};
