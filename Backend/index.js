
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
// ==================== START SERVER ====================


const startServer = async () => {
  await connectDB();

  app.listen(8090, () => {
    console.log("Server is started on port 8090");
  });
};

startServer();

