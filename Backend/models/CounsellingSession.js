const mongoose = require("mongoose");

const CounsellingSessionSchema = mongoose.Schema
(
  {
    counsellingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellingRequest",
      required: true,
      index: true
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sessionNumber: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["initial", "follow_up", "admission_guidance", "other"],
      default: "initial"
    },

    startedAt: Date,
    endedAt: Date,
    durationMinutes: Number,

    mode: {
      type: String,
      enum: ["phone", "video", "in_person", "chat"],
      required: true
    },

    outcome: {
      type: String,
      enum: [
        "counselling_completed",
        "follow_up_required",
        "recommendations_needed",
        "student_unreachable",
        "student_not_interested"
      ]
    },

    studentQuestions: [String],
    nextAction: String,
    nextFollowUpAt: Date,

    status: {
      type: String,
      enum: ["in_progress", "completed", "cancelled"],
      default: "in_progress"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CounsellingSession", CounsellingSessionSchema);