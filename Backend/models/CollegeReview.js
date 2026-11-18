
const mongoose = require("mongoose");

const collegeReviewSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: [true, "College is required"]
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Student is required"]
    },

    studentModel : {
       type : String,
       enum : ["User", "Students"],
       required : true
    },

    overallRating: {
      type: Number,
      required: [true, "Overall rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"]
    },

    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department name is too long"]
    },

    departmentRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"]
    },

    facilities: {
      hostel: { type: Number, min: 1, max: 5 },
      library: { type: Number, min: 1, max: 5 },
      laboratory: { type: Number, min: 1, max: 5 },
      classrooms: { type: Number, min: 1, max: 5 },
      canteen: { type: Number, min: 1, max: 5 },
      sports: { type: Number, min: 1, max: 5 },
      wifi: { type: Number, min: 1, max: 5 },
      transport: { type: Number, min: 1, max: 5 },
      cleanliness: { type: Number, min: 1, max: 5 },
      safety: { type: Number, min: 1, max: 5 }
    },

    reviewTitle: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      minlength: [5, "Title must contain at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"]
    },

    review: {
      type: String,
      required: [true, "Review description is required"],
      trim: true,
      minlength: [20, "Review must contain at least 20 characters"],
      maxlength: [2000, "Review cannot exceed 2000 characters"]
    },

    pros: {
      type: String,
      trim: true,
      maxlength: [1000, "Pros cannot exceed 1000 characters"]
    },

    cons: {
      type: String,
      trim: true,
      maxlength: [1000, "Cons cannot exceed 1000 characters"]
    },

    studyYear: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// One review per student per college
collegeReviewSchema.index(
  { college: 1, student: 1, studentModel : 1},
  { unique: true }
);

module.exports = mongoose.model("CollegeReview", collegeReviewSchema);
