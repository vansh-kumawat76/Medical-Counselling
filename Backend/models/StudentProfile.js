
const mongoose = require("mongoose");

const parentDetailsSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    occupation: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    personalDetails: {
      firstName: { type: String, trim: true, default: "" },
      lastName: { type: String, trim: true, default: "" },
      fullName: { type: String, trim: true, default: "" },

      father: {
        type: parentDetailsSchema,
        default: () => ({}),
      },

      mother: {
        type: parentDetailsSchema,
        default: () => ({}),
      },

      personalEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      mobile: { type: String, trim: true, default: "" },
      alternateMobile: { type: String, trim: true, default: "" },

      currentAddress: { type: String, trim: true, default: "" },
      permanentAddress: { type: String, trim: true, default: "" },
      pinCode: { type: String, trim: true, default: "" },
    },

    dob: Date,

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    city: String,
    state: String,
    country: String,

    profileImage: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    academicDetails: {
      tenth: {
        board: String,
        percentage: Number,
        passingYear: Number,
      },

      twelfth: {
        board: String,
        percentage: Number,
        passingYear: Number,
        stream: String,
      },

      graduation: {
        college: String,
        course: String,
        percentage: Number,
        passingYear: Number,
      },
    },

    entranceExams: [
      {
        exam: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EntranceExam",
        },
        score: Number,
        percentile: Number,
        rank: Number,
        year: Number,
      },
    ],

    preferredLocations: [String],

    preferredCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    budget: {
      min: Number,
      max: Number,
    },
  },
  { timestamps: true }
);

// Automatically generate full names
function generateFullName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

studentProfileSchema.pre("validate", function () {
  if (this.personalDetails) {
    const details = this.personalDetails;

    details.fullName = generateFullName(
      details.firstName,
      details.lastName
    );

    ["father", "mother"].forEach((parent) => {
      if (details[parent]) {
        details[parent].fullName = generateFullName(
          details[parent].firstName,
          details[parent].lastName
        );
      }
    });
  }
});

module.exports = mongoose.model("studentProfile", studentProfileSchema);
