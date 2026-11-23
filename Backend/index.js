
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const cors = require("cors");

const student = require("./routes/StudentRoutes");
const college = require("./routes/CollegeRoutes.js");
const university = require("./routes/University.js");

const permissionRoutes = require("./routes/Permisson");
const roleRoutes = require("./routes/RoleRoutes.js");
const streamRoutes = require("./routes/StreamRoutes.js");
const degree = require("./routes/DegreeRoutes");
const course = require("./routes/CourseRoutes.js");
const specializationRoutes = require("./routes/SpecializationRoutes");
const userRoutes = require("./routes/UserRoutes.js");
const otpRoutes = require("./routes/OtpRoutes");
const contactRoutes = require("./routes/ContactRoutes.js");
const emailTemplates = require("./routes/EmailTemplateRoutes.js");
const imageRoutes = require("./routes/ImageRoutes");
const studentProfile = require("./routes/StudentProfileRoutes.js");
const entranceExamRoutes = require("./routes/EntranceExamRoutes");
const counselling = require("./routes/CounsellingRequestRoutes.js");
const appointment = require("./routes/AppointmentRoutes");
const sessionRoutes = require("./routes/CounsellingSessionRoutes.js");
const counsellingAssignment = require("./routes/CounsellingAssignmentRoutes");
const counsellingNotes = require("./routes/CounsellingNoteRoutes.js");
const FollowUpRoutes = require("./routes/FollowUpRoutes");
const Feedback = require("./routes/FeedbackRoutes");
const backgroundVideoRoutes = require("./routes/BackgroundVideosRoutes.js");
const notificationPreferencesRoutes = require("./routes/NotificationPreferencesRoutes");
const paymentRoutes = require("./routes/PaymentRoutes");
const planRoutes = require("./routes/PlanRoutes");
const uploadDocumentRoutes = require("./routes/UploadDocumentRoutes.js");
const casteRoutes = require("./routes/CasteRoutes");
const stateRoutes = require("./routes/StateRoutes");
const collegeRecommendationRoutes = require("./routes/CollegeRecommend.js");
const collegeCourseRoutes = require("./routes/CollegeCourseRoutes");
const collegeReviewRoutes = require("./routes/CollegeReviewRoutes");

const app = express();

// ==================== MIDDLEWARE ====================

app.use(
  cors({
    origin: [
      "https://medical-counselling-6e13.vercel.app",
      "https://medical-counselling-frontend.onrender.com",
      "https://medical-counselling-admin.onrender.com",
      "https://medical-counselling-1.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(require("cookie-parser")());

// ==================== START SERVER ====================

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    // Load Redis-based rate limiters after Redis connection
  //  const { generalLimiter, loginLimiter } = require("./middleware/rateLimiter");
  const { generalLimiter } = require("./middleware/rateLimiter");
    const authRoutes = require("./routes/AuthRoutes.js");

    // ==================== ROUTES ====================

    // General rate limiter applied before all routes
    app.use(generalLimiter);

    app.use("/", authRoutes);
   
    app.use("/student", student);
    app.use("/college", college);
    app.use("/university", university);

    app.use("/permission", permissionRoutes);
    app.use("/roles", roleRoutes);

    app.use("/stream", streamRoutes);
    app.use("/degree", degree);
    app.use("/course", course);
    app.use("/specialization", specializationRoutes);

    app.use("/", userRoutes);
    app.use("/", otpRoutes);
    app.use("/", contactRoutes);
    app.use("/email-template", emailTemplates);
    app.use("/home-page", imageRoutes);
    app.use("/studentProfile", studentProfile);
    app.use("/entrance-exam", entranceExamRoutes);

    app.use("/counsellingRequest", counselling);
    app.use("/appointment", appointment);
    app.use("/session", sessionRoutes);
    app.use("/counsellingAssignment", counsellingAssignment);
    app.use("/Notes", counsellingNotes);
    app.use("/FollowUp", FollowUpRoutes);
    app.use("/feedback", Feedback);
    app.use("/background-video", backgroundVideoRoutes);
    app.use("/notification-preferences", notificationPreferencesRoutes);
    app.use("/payment", paymentRoutes);
    app.use("/plans", planRoutes);
    app.use("/upload-documents", uploadDocumentRoutes);
    app.use("/caste", casteRoutes);
    app.use("/state", stateRoutes);
    app.use("/college-recommendation", collegeRecommendationRoutes);
    app.use("/college-course", collegeCourseRoutes);
    app.use("/college-review", collegeReviewRoutes);

    app.get("/test-api", (req, res) => {
      res.json({
        status: true,
        message: "Backend API working successfully",
      });
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server is started on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
