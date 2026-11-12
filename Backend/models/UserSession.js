
const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "accountModel",
    },

    accountModel: {
      type: String,
      enum: ["User", "Students"],
      required: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    device: {
      type: String,
      default: "Unknown Device",
    },

    browser: {
      type: String,
      default: "Unknown Browser",
    },

    os: {
      type: String,
      default: "Unknown OS",
    },

    ipAddress: {
      type: String,
      default: "Unknown",
    },

    userAgent: {
      type: String,
      default: "",
    },

    loginAt: {
      type: Date,
      default: Date.now,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    terminatedAt: {
      type: Date,
      default: null,
    },

    terminationReason: {
      type: String,
      enum: ["logout", "revoked", "expired", null],
      default: null,
    },
  },
  { timestamps: true }
);

userSessionSchema.index({
  userId: 1,
  accountModel: 1,
  isActive: 1,
});

module.exports = mongoose.model("UserSession", userSessionSchema);
