
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

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
const authRoutes = require("./routes/AuthRoutes.js")
const userRoutes = require("./routes/UserRoutes.js")
const otpRoutes = require("./routes/OtpRoutes");
const contactRoutes = require("./routes/ContactRoutes.js");
const emailTemplates = require("./routes/EmailTemplateRoutes.js")
const imageRoutes = require("./routes/ImageRoutes");
const studentProfile = require("./routes/StudentProfileRoutes.js")
const entranceExamRoutes = require("./routes/EntranceExamRoutes");
const {generalLimiter} = require("./middleware/rateLimiter");
const counselling = require("./routes/CounsellingRequestRoutes.js")
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
const uploadDocumentRoutes = require("./routes/UploadDocumentRoutes.js")
const app = express();

// ==================== MIDDLEWARE ====================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(require("cookie-parser")());
// ==================== ROUTES ====================

app.use("/student", student);
app.use("/college", college);
app.use("/university",university);

app.use("/permission", permissionRoutes);
app.use("/roles", roleRoutes);

app.use("/stream",streamRoutes);
app.use("/degree",degree);
app.use("/course",course);
app.use("/specialization",specializationRoutes);
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", otpRoutes);
app.use("/", contactRoutes);
app.use("/email-template", emailTemplates);
app.use("/home-page", imageRoutes);
app.use("/studentProfile", studentProfile);
app.use("/entrance-exam", entranceExamRoutes);
app.use(generalLimiter);
app.use("/counsellingRequest", counselling);
app.use("/appointment", appointment);
app.use("/session",sessionRoutes);
app.use("/counsellingAssignment", counsellingAssignment);
app.use("/Notes", counsellingNotes);
app.use("/FollowUp", FollowUpRoutes);
app.use("/feedback", Feedback);
app.use("/background-video", backgroundVideoRoutes);
app.use("/notification-preferences", notificationPreferencesRoutes);
app.use("/payment", paymentRoutes);
app.use("/plans", planRoutes);
app.use("/upload-documents", uploadDocumentRoutes);
// ==================== START SERVER ====================

app.get("/test-api", (req, res) => {
  res.json({
    status: true,
    message: "Backend API working successfully",
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(8090, () => {
    console.log("Server is started on port 8090");
  });
};

startServer();

