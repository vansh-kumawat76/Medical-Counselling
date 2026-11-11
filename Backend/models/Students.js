const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  phone: {
    type: Number,
  },
  password: {
    type: String,
  },
  role: 
  {type : mongoose.Schema.Types.ObjectId,
    ref : "Role",
    required : true
  },
  status: String,
  // Account Deactivation Status
  
});

module.exports = mongoose.model("Students", userSchema);
