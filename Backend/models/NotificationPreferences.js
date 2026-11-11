
const mongoose = require("mongoose");

const notificationPreferencesSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      required: true,
      unique: true,
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    appointmentNotifications: {
      type: Boolean,
      default: true,
    },

    counsellingNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema
);
