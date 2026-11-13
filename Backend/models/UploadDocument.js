
const mongoose = require("mongoose");

const uploadDocumentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "accountModel",
    },

    accountModel: {
      type: String,
      enum: ["User", "Students"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "10th Marksheet",
        "12th Marksheet",
        "Graduation",
        "Aadhaar",
        "Pan Card",
        "Neet Score",
        "Voter Id"
      ],
      required: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    resourceType: {
  type: String,
  enum: ["image", "raw", "video"],
  required: true,
},

    fileType: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", "webp"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

uploadDocumentSchema.index({
  student: 1,
  accountModel: 1,
});

module.exports = mongoose.model(
  "StudentDocument",
  uploadDocumentSchema
);
