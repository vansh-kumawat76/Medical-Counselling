const mongoose = require("mongoose");

const CounsellingRequestSchema = mongoose.Schema(
     {
    requestNumber: {
      type: String,
      required: true,
      unique: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    assignedTo : {
      type : mongoose.Schema.Types.ObjectId,
      ref : "User",
      default : null,
      index : true
    },

    academicYear: {
      type: String,
      required: true
    },

    admissionLevel: {
      type: String,
      enum: ["UG", "PG", "Diploma", "Doctorate", "Other"],
      required: true
    },

    preferredStreams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream"
    }],

    preferredCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course"
    }],

    preferredLocations: [{
      city: String,
      state: String,
      country: String
    }],

    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "INR" }
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

    counsellingMode: {
      type: String,
      enum: ["phone", "video", "in_person", "chat"],
      default: "phone"
    },

    preferredTime: {
      date: Date,
      timezone: {
        type: String,
        default: "Asia/Kolkata"
      }
    },

    status: {
      type: String,
      enum: [
        "new",
        "assigned",
        "contact_pending",
        "in_progress",
        "recommendations_shared",
        "converted",
        "closed",
        "cancelled"
      ],
      default: "new",
      index: true
    },

    statusHistory: [
  {
    oldStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
],

    source: {
      type: String,
      enum: [
        "website",
        "organic",
        "referral",
        "campaign",
        "college",
        "other"
      ],
      default: "website"
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal"
    },

    closedAt: Date,
    cancellationReason: String
  },
  { timestamps: true }

)

module.exports = mongoose.model("CounsellingRequest", CounsellingRequestSchema);