const mongoose = require("mongoose");

const CounsellingNoteSchema = mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellingSession",
      required: true,
      index: true
    },

    counsellingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellingRequest",
      required: true
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    visibility: {
      type: String,
      enum: ["internal", "student_visible"],
      default: "internal"
    },

    category: {
      type: String,
      enum: [
        "academic",
        "budget",
        "preferences",
        "follow_up",
        "general"
      ],
      default: "general"
    },

    content: {
      type: String,
      required: true,
      maxlength: 10000
    },

    editedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("CounsellingNote", CounsellingNoteSchema);