
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Students = require("../models/Students");
const otpGenerator = require("otp-generator");
const transport = require("../config/mailer");
const EmailTemplate = require("../models/EmailTemplate");
const { randomUUID } = require("crypto");
const UserSession = require("../models/UserSession");

const loginUser = async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and password.",
      });
    }

    if (!["user", "admin"].includes(portal)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid login portal.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let emailVerify = await User.findOne({
      email: normalizedEmail,
    }).populate({
      path: "role",
      model: Role,
      populate: {
        path: "permissions",
        model: "Permission",
      },
    });

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
        message: "No account was found with the provided email address.",
      });
    }

    const accountModel = emailVerify.constructor.modelName;

    if (
      emailVerify.role?.role === "Student" &&
      emailVerify.accountStatus === "deactivated"
    ) {
      return res.status(403).json({
        status: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    if (!emailVerify.password) {
      return res.status(401).json({
        status: false,
        message: "A password has not been configured for this account.",
      });
    }

    const verifyPassword = await bcrypt.compare(
      password,
      emailVerify.password
    );

    if (!verifyPassword) {
      return res.status(401).json({
        status: false,
        message: "The password you entered is incorrect.",
      });
    }

    const roleName = emailVerify.role?.role;

    if (portal === "user" && roleName !== "Student") {
      return res.status(403).json({
        status: false,
        message: "Only students are authorized to log in through this portal.",
      });
    }

    if (portal === "admin" && !roleName) {
      return res.status(403).json({
        status: false,
        message: "Your assigned role does not have access to this portal.",
      });
    }

    const permissions = (
      emailVerify.role?.permissions || []
    ).map((permission) => permission.name);

    // Create unique session
    const sessionId = randomUUID();

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    const userAgent = req.headers["user-agent"] || "";

    let browser = "Unknown Browser";
    let os = "Unknown OS";
    let device = "Desktop";

    if (/Edg/i.test(userAgent)) browser = "Microsoft Edge";
    else if (/Chrome/i.test(userAgent)) browser = "Google Chrome";
    else if (/Firefox/i.test(userAgent)) browser = "Mozilla Firefox";
    else if (/Safari/i.test(userAgent)) browser = "Safari";

    if (/Windows/i.test(userAgent)) os = "Windows";
    else if (/Android/i.test(userAgent)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";
    else if (/Mac OS/i.test(userAgent)) os = "macOS";
    else if (/Linux/i.test(userAgent)) os = "Linux";

    if (/Mobile|Android|iPhone/i.test(userAgent)) {
      device = "Mobile";
    }

    const ipAddress =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "Unknown";

    await UserSession.create({
      userId: emailVerify._id,
      accountModel,
      sessionId,
      device,
      browser,
      os,
      ipAddress,
      userAgent,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt,
      isActive: true,
    });

    const token = jwt.sign(
      {
        email: emailVerify.email,
        role: roleName,
        permissions,
        userId: emailVerify._id,
        sessionId,
      },
      "gpTech",
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      status: true,
      message: "You have logged in successfully.",
      emailVerify,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected server error occurred during login.",
    });
  }
};

const dashboard = (req, res) => {
  return res.send({
    status: true,
    message: "Welcome to your dashboard.",
  });
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "Please provide your email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!userEmail) {
      return res.status(404).send({
        status: false,
        message: "No account was found with the provided email address.",
      });
    }

    const emailTemplate = await EmailTemplate.findOne({
      slug: "forgot-password-otp",
      status: "active",
    });

    if (!emailTemplate) {
      return res.status(500).send({
        status: false,
        message: "The password recovery email template is unavailable or inactive.",
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

    const emailHtml = emailTemplate.content.replace(/\{\{otp\}\}/g, otp);

    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: emailTemplate.subject,
      text: `Forgot Password OTP is ${otp}`,
      html: emailHtml,
    });

    return res.send({
      status: true,
      message: "A password recovery OTP has been generated and sent to your email address.",
    });
  } catch (error) {
    console.log("Forget Password Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred while processing your password recovery request.",
    });
  }
};

const verifyForgetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        status: false,
        message: "Please provide both your email address and OTP.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userForgetUser = await User.findOne({
      email: normalizedEmail,
    });

    if (!userForgetUser) {
      return res.status(404).send({
        status: false,
        message: "The requested user account could not be found.",
      });
    }

    if (String(userForgetUser.otp) !== String(otp)) {
      return res.status(400).send({
        status: false,
        message: "The OTP you entered is invalid.",
      });
    }

    if (
      !userForgetUser.otpExpiresAt ||
      userForgetUser.otpExpiresAt < new Date()
    ) {
      return res.status(400).send({
        status: false,
        message: "The OTP has expired. Please request a new one.",
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
      message: "Your OTP has been verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.log("Verify Forget OTP Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected server error occurred while verifying the OTP.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).send({
        status: false,
        message: "Please provide both the password reset token and new password.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).send({
        status: false,
        message: "Your new password must contain at least 8 characters.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(resetToken, "gpTech");
    } catch (error) {
      return res.status(401).send({
        status: false,
        message: "The password reset token is invalid or has expired. Please verify your OTP again.",
      });
    }

    if (
      decoded.purpose !== "reset-password" ||
      !decoded.email
    ) {
      return res.status(401).send({
        status: false,
        message: "The provided password reset token is invalid.",
      });
    }

    const user = await User.findOne({
      email: decoded.email,
    });

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "The requested user account could not be found.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.send({
      status: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.log("Reset Password Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected server error occurred while resetting your password.",
    });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    status: true,
    message: "You have logged out successfully.",
  });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication is required to change your password.",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "Please provide both your current password and new password.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message: "Your new password must contain at least 8 characters.",
      });
    }

    let userAccount = await User.findById(userId);

    if (!userAccount) {
      userAccount = await Students.findById(userId);
    }

    if (!userAccount) {
      return res.status(404).json({
        status: false,
        message: "The requested user account could not be found.",
      });
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      userAccount.password
    );

    if (!validPassword) {
      return res.status(400).json({
        status: false,
        message: "Your current password is incorrect.",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      userAccount.password
    );

    if (samePassword) {
      return res.status(400).json({
        status: false,
        message: "Your new password must be different from your current password.",
      });
    }

    userAccount.password = await bcrypt.hash(newPassword, 10);
    await userAccount.save();

    return res.status(200).json({
      status: true,
      message: "Your password has been changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while changing your password.",
    });
  }
};

module.exports = {
  loginUser,
  dashboard,
  forgetPassword,
  verifyForgetOtp,
  resetPassword,
  changePassword,
  logoutUser,
};
