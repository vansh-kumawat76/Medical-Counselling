const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  otp: String,
  otpExpiresAt : {
    type :  Date
  },
  otpAttempts: {
  type: Number,
  default: 0,
},
otpBlockedUntil: {
  type: Date,
  default: null,
},
  password: String,
   // Student Account Status
  accountStatus: {
    type: String,
    enum: ["active", "deactivated"],
    default: "active",
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  lastLoginAt : {
    type : Date,
    default : null,
  },
  passwordChangedAt : {
    type : Date,
    default : null,
  }
},{timestamps : true});

module.exports = mongoose.model("User", userSchema);