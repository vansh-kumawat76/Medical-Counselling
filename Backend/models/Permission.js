const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
    type: String,
    required: true,
    unique: true,
  },
  resource: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  description: String,
});

module.exports = mongoose.model("Permission", permissionSchema)
