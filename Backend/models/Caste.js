
const mongoose = require("mongoose");

const casteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["General", "OBC", "SC", "ST", "EWS", "Other"],
      required: true,
    },

    level: {
      type: String,
      enum: ["Central", "State"],
      required: true,
    },

    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      default: null,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Same caste name can exist in different levels or states.
casteSchema.index(
  { name: 1, level: 1, state: 1 },
  { unique: true }
);

module.exports = mongoose.model("Caste", casteSchema);
