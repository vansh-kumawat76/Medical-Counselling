const mongoose = require("mongoose");
const studentProfileSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true
  },

  dob: Date,

  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },

  city: String,
  state: String,
  country: String,

  academicDetails: {
    tenth: {
      board: String,
      percentage: Number,
      passingYear: Number
    },

    twelfth: {
      board: String,
      percentage: Number,
      passingYear: Number,
      stream: String
    },

    graduation: {
      college: String,
      course: String,
      percentage: Number,
      passingYear: Number
    }
  },

  entranceExams: [{
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EntranceExam"
    },

    score: Number,
    percentile: Number,
    rank: Number,
    year: Number
  }],

  preferredLocations: [String],

  preferredCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }],

  budget: {
    min: Number,
    max: Number
  }

}, { timestamps: true });

module.exports = mongoose.model("studentProfile", studentProfileSchema);