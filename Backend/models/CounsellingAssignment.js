const mongoose = require("mongoose");

const CounsellingAssignmentSchema = mongoose.Schema(
  {
    counsellingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellingRequest",
      required: true,
      index: true
    },

    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedAt: {
      type: Date,
      default: Date.now
    },

    assignmentType: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual"
    },

    status: {
      type: String,
      enum: ["active", "reassigned", "completed"],
      default: "active"
    },

    reassignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    reassignmentReason: String,

    endedAt: Date
  },
  { timestamps: true }

)

module.exports = mongoose.model("CounsellingAssignment", CounsellingAssignmentSchema);
