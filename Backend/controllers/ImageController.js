const HomePageImage = require("../models/Image");
async function SaveImageController(req, res) {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        status: false,
        message: "Image URL is required",
      });
    }

    const image = await HomePageImage.create({ imageUrl });

    return res.status(201).json({
      status: true,
      message: "Image URL saved successfully",
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
        message: "Home page image not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Image fetched successfully",
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
    GetImageController
}