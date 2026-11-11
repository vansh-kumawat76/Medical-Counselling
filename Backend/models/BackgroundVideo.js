
const mongoose = require("mongoose");

const BackgroundVideoSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    originalName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BackgroundVideo", BackgroundVideoSchema);
