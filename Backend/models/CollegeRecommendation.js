
const mongoose = require("mongoose");

const collegeRecommendationSchema = new mongoose.Schema(
  {
    counsellingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellingRequest",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    colleges: [
      {
        college: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "College",
          required: true,
        },

        collegeCourse: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CollegeCourse",
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

        fees: {
          type: Number,
          min: 0,
          default: 0,
        },

        remarks: {
          type: String,
          default: "",
          trim: true,
        },

        recommendationReason: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    counsellorRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "shared"],
      default: "draft",
      index: true,
    },

    sharedAt: {
      type: Date,
      default: null,
    },

    // Student Recommendation Response
    studentResponse: {
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },

      remarks: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
      },

      respondedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

collegeRecommendationSchema.index({
  counsellingRequest: 1,
  student: 1,
});

module.exports = mongoose.model(
  "CollegeRecommendation",
  collegeRecommendationSchema
);
