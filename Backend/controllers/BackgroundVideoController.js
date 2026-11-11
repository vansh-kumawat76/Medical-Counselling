
const BackgroundVideo = require("../models/BackgroundVideo");
const uploadVideoToCloudinary = require("../utils/uploadVideoToCloudinary");

// Upload Background Video
const UploadBackgroundVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Please select a video to upload.",
      });
    }

    const uploadedVideo = await uploadVideoToCloudinary(req.file.buffer);

    // Deactivate previous background video
    await BackgroundVideo.updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    );

    const video = await BackgroundVideo.create({
      videoUrl: uploadedVideo.url,
      publicId: uploadedVideo.public_id,
      originalName: req.file.originalname,
      isActive: true,
    });

    return res.status(201).json({
      status: true,
      message: "The background video has been uploaded successfully.",
      data: video,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Get Active Background Video
const GetActiveBackgroundVideo = async (req, res) => {
  try {
    const video = await BackgroundVideo.findOne({
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!video) {
      return res.status(404).json({
        status: false,
        message: "No active background video is currently available.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The active background video has been retrieved successfully.",
      data: video,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  UploadBackgroundVideo,
  GetActiveBackgroundVideo,
};
