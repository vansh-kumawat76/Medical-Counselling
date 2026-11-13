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
  lastLoginAt : {
    type : Date,
    default : null
  },
passwordChangedAt : {
  type : Date,
  default : null,
},
  status: String,
  // Account Deactivation Status
  
}, {timestamps : true});

module.exports = mongoose.model("Students", userSchema);
