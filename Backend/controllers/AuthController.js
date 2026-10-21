
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Students = require("../models/Students");
const otpGenerator = require("otp-generator");
const transport = require("../config/mailer");
const loginUser =  async (req, res) => {
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

    // // Set cookie
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
};

const dashboard = (req, res) => {
  return res.send({
    status: true,
    message: "Welcome to the dashboard",
  });
};


const forgetPassword = async (req, res) => {
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
};


const verifyForgetOtp = async (req, res) => {
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
};


const resetPassword = async (req, res) => {
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
};



module.exports = {loginUser,
   dashboard,
    forgetPassword,
     verifyForgetOtp,
    resetPassword
  }