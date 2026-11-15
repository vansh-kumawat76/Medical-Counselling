
const mongoose = require("mongoose");

const collegeCourseSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    specialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialization",
      default: null,
    },

    duration: {
      type: Number,
      min: 0,
    },

    totalSeats: {
      type: Number,
      min: 0,
      default: 0,
    },

    availableSeats: {
      type: Number,
      min: 0,
      default: 0,
    },

    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
    },

    admissionOpen: {
      type: Boolean,
      default: false,
    },

    applicationDeadline: {
      type: Date,
      default: null,
    },

    // Fees Details
    totalFees: {
      type: Number,
      min: 0,
      default: 0,
    },

    yearlyFees: {
      type: Number,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    additionalCharges: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          min: 0,
          default: 0,
        },
        isMandatory: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Eligibility Details
    eligibility: {
      type: String,
      default: "",
    },

    entranceExams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EntranceExam",
      },
    ],

    scholarshipAvailable: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CollegeCourse", collegeCourseSchema);
