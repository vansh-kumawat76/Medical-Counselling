const mongoose = require("mongoose");

const AppointmentSchema = mongoose.Schema(
  {
    counsellingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellingRequest",
      required: true,
      index: true
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

    scheduledStart: {
      type: Date,
      required: true
    },

    scheduledEnd: {
      type: Date,
      required: true
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },

    mode: {
      type: String,
      enum: ["phone", "video", "in_person", "chat"],
      required: true
    },

    meetingLink: String,
    location: String,

    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
        "no_show"
      ],
      default: "scheduled",
      index: true
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    cancellationReason: String,

    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },

    reminderSentAt: Date,

    completedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema)