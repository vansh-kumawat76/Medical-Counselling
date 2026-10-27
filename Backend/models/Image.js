const mongoose = require("mongoose");

const HomePageImageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HomePageImage", HomePageImageSchema);