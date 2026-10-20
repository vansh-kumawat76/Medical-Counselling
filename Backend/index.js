
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const Permission = require("./models/Permission");
const checkPermission = require("./middleware/permission");
const auth = require("./auth.js");

const Role = require("./models/Role");
const User = require("./models/User");
const Students = require("./models/Students");

const student = require("./routes/StudentRoutes");
const college = require("./routes/CollegeRoutes.js");
const university = require("./routes/University.js");

const permissionRoutes = require("./routes/Permisson");
const roleRoutes = require("./routes/RoleRoutes.js");
const streamRoutes = require("./routes/StreamRoutes.js");
const degree = require("./routes/DegreeRoutes");
const course = require("./routes/CourseRoutes.js");
const specializationRoutes = require("./routes/SpecializationRoutes");

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

app.use(student);
app.use(college);
app.use(university);

app.use("/roles", permissionRoutes);
app.use("/roles", roleRoutes);

app.use(streamRoutes);
app.use(degree);
app.use(course);
app.use(specializationRoutes);

// ==================== EMAIL TRANSPORT ====================

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ==================== DATABASE CONNECTION ====================

mongoose
  .connect("mongodb://localhost:27017/LiveProject")
  .then(() => console.log("Database is connected"))
  .catch((error) => console.log("Database connection error:", error));

// ==================== TEST API ====================

app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.status(200).send("Server is working");
});

// ==================== CREATE USER API ====================

app.post("/create-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        status: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existuser = await User.findOne({
      email: normalizedEmail,
    });

    console.log("CREATE USER API HIT");
    console.log("Email received:", normalizedEmail);
    console.log("Existing user:", Boolean(existuser));
    console.log("Connected database:", mongoose.connection.name);
    console.log("User collection:", User.collection.name);

    if (existuser) {
      return res.status(409).send({
        status: false,
        message: "User already exists",
      });
    }

    const studentRole = await Role.findOne({
      role: "Student",
    });

    if (!studentRole) {
      return res.status(500).send({
        status: false,
        message: "Student role not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: normalizedEmail,
      password: hashPassword,
      role: studentRole._id,
    });

    return res.status(201).send({
      status: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("Create User Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

// ==================== VERIFY EMAIL API ====================

app.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let verifyEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!verifyEmail) {
      verifyEmail = await Students.findOne({
        email: normalizedEmail,
      });
    }

    if (!verifyEmail) {
      return res.status(404).send({
        status: false,
        message: "Email not found",
      });
    }

    return res.send({
      status: true,
      message: "Email is verified",
    });
  } catch (error) {
    console.log("Verify Email Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

// ==================== GENERATE OTP API ====================

app.post("/otp-generate", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: "Your OTP",
      text: `Your OTP is ${otp}`,
      html: `<h1>OTP: ${otp}</h1>`,
    });

    return res.send({
      status: true,
      message: "OTP generated and sent successfully",
    });
  } catch (error) {
    console.log("OTP Generate Error:", error);

    return res.status(500).send({
      status: false,
      message: "Something went wrong",
    });
  }
});

// ==================== VERIFY OTP API ====================

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const verifyEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!verifyEmail) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    if (String(verifyEmail.otp) !== String(otp)) {
      return res.status(400).send({
        status: false,
        message: "Invalid OTP",
      });
    }

    if (
      verifyEmail.otpExpiresAt &&
      verifyEmail.otpExpiresAt < new Date()
    ) {
      return res.status(400).send({
        status: false,
        message: "OTP expired. Please request a new OTP",
      });
    }

    return res.send({
      status: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

// ==================== LOGIN API ====================

app.post("/login-user", async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    if (!["user", "admin"].includes(portal)) {
      return res.status(400).json({
        status: false,
        message: "Invalid login portal",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // First search in the User collection
    let emailVerify = await User.findOne({
      email: normalizedEmail,
    }).populate({
      path: "role",
      populate: {
        path: "permissions",
        model: "Permission",
      },
    });

    // If not found, search in the Students collection
    if (!emailVerify) {
      emailVerify = await Students.findOne({
        email: normalizedEmail,
      }).populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });
    }

    console.log("Login email:", normalizedEmail);
    console.log("Account found:", Boolean(emailVerify));

    if (!emailVerify) {
      return res.status(404).json({
        status: false,
        message: "Email not found",
      });
    }

    if (!emailVerify.password) {
      return res.status(401).json({
        status: false,
        message: "Password is not configured for this account",
      });
    }

    // Verify password
    const verifyPassword = await bcrypt.compare(
      password,
      emailVerify.password
    );

    if (!verifyPassword) {
      return res.status(401).json({
        status: false,
        message: "Password incorrect",
      });
    }

    const roleName = emailVerify.role?.role;

    // Next.js user portal: Student only
    if (portal === "user" && roleName !== "Student") {
      return res.status(403).json({
        status: false,
        message: "Only Student users can login from this portal",
      });
    }

    // Admin dashboard: SuperAdmin, Admin and Student
    if (
      portal === "admin" && !roleName) {
      return res.status(403).json({
        status: false,
        message: "Your role is not allowed on this portal",
      });
    }

    const permissions = (
      emailVerify.role?.permissions || []
    ).map((permission) => permission.name);

    // Generate JWT token
    const token = jwt.sign(
      {
        email: emailVerify.email,
        role: roleName,
        permissions,
      },
      "gpTech",
      { expiresIn: "30d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      status: true,
      message: "Login successful",
      emailVerify,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      status: false,
      message: "Server error during login",
    });
  }
});

// ==================== DASHBOARD API ====================

app.get("/dashboard", auth, (req, res) => {
  return res.send({
    status: true,
    message: "Welcome to the dashboard",
  });
});

// ==================== FORGET PASSWORD API ====================

app.post("/forget-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!userEmail) {
      return res.status(404).send({
        status: false,
        message: "Invalid email",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });

    userEmail.otp = otp;
    userEmail.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await userEmail.save();

    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: "Password Reset OTP",
      text: `Forget Password OTP is ${otp}`,
      html: `<h1>OTP: ${otp}</h1>`,
    });

    return res.send({
      status: true,
      message: "OTP generated successfully",
    });
  } catch (error) {
    console.log("Forget Password Error:", error);

    return res.status(500).send({
      status: false,
      message: "Something went wrong",
    });
  }
});

// ==================== VERIFY FORGET OTP API ====================

app.post("/verify-forget-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userForgetUser = await User.findOne({
      email: normalizedEmail,
    });

    if (!userForgetUser) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    if (String(userForgetUser.otp) !== String(otp)) {
      return res.status(400).send({
        status: false,
        message: "Invalid OTP",
      });
    }

    if (
      !userForgetUser.otpExpiresAt ||
      userForgetUser.otpExpiresAt < new Date()
    ) {
      return res.status(400).send({
        status: false,
        message: "OTP expired. Please request a new OTP",
      });
    }

    const resetToken = jwt.sign(
      {
        email: userForgetUser.email,
        purpose: "reset-password",
      },
      "gpTech",
      { expiresIn: "10m" }
    );

    userForgetUser.otp = undefined;
    userForgetUser.otpExpiresAt = undefined;

    await userForgetUser.save();

    return res.send({
      status: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.log("Verify Forget OTP Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

// ==================== RESET PASSWORD API ====================

app.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).send({
        status: false,
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).send({
        status: false,
        message: "Password must be at least 8 characters",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(resetToken, "gpTech");
    } catch (error) {
      return res.status(401).send({
        status: false,
        message: "Reset token is invalid or expired. Verify OTP again.",
      });
    }

    if (
      decoded.purpose !== "reset-password" ||
      !decoded.email
    ) {
      return res.status(401).send({
        status: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findOne({
      email: decoded.email,
    });

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.send({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("Reset Password Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

// ==================== STUDENT PERMISSION TEST ====================

app.get(
  "/students/test",
  auth,
  checkPermission("student.view"),
  (req, res) => {
    res.json({
      status: true,
      message: "Students read permission granted",
    });
  }
);

// ==================== ROLES AND PERMISSIONS API ====================

app.get("/roles-permissions", auth, async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions");
    const permissions = await Permission.find();

    return res.status(200).json({
      status: true,
      message: "Roles & permissions fetched successfully",
      roles,
      permissions,
    });
  } catch (error) {
    console.log("Roles Permissions Error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch roles & permissions",
    });
  }
});

// ==================== STUDENT DELETE PERMISSION TEST ====================

app.get(
  "/students/delete-test",
  auth,
  checkPermission("student.delete"),
  (req, res) => {
    console.log("Logged-in email:", req.user.email);
    console.log("Logged-in role:", req.user.role);

    res.json({
      status: true,
      message: "Student delete permission granted",
    });
  }
);

// ==================== START SERVER ====================

app.listen(8090, () => {
  console.log("Server is started on port 8090");
});
