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
});

module.exports = mongoose.model("User", userSchema);