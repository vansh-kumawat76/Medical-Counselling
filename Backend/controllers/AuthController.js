
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Students = require("../models/Students");
const otpGenerator = require("otp-generator");
const transport = require("../config/mailer");
const user = require("../models/User");
const EmailTemplate = require("../models/EmailTemplate");

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

    // First search in the User collection
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

    const roleCheck = await Role.findById(emailVerify.role?._id).lean();

    console.log("========== DIRECT DB CHECK ==========");
    console.log("Role Collection:", Role.collection.name);
    console.log("Permission Collection:", Permission.collection.name);
    console.log("Raw Role Permissions:", roleCheck?.permissions);

    const rawRole = await Role.collection.findOne({
      _id: new mongoose.Types.ObjectId("6aeb0069cefbc9530cfc1abf")
    });

    console.log("RAW ROLE FROM BACKEND:", rawRole);

    const permissionCheck = await Permission.find({
      _id: { $in: roleCheck?.permissions || [] },
    }).lean();

    console.log("Direct Permission Query:", permissionCheck);
    console.log("Direct Permission Count:", permissionCheck.length);
    console.log("=====================================");

    console.log("ROLE POPULATE CHECK:", {
      role: emailVerify?.role?.role,
      permissionCount: emailVerify?.role?.permissions?.length,
      permissions: emailVerify?.role?.permissions,
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
        message: "No account was found with the provided email address.",
      });
    }

    // Check Student Account Deactivation
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

    // Verify password
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

    console.log("========== LOGIN DEBUG ==========");
    console.log("User Email:", emailVerify.email);
    console.log("Role ID:", emailVerify.role?._id);
    console.log("Role Name:", emailVerify.role?.role);
    console.log("Role Permissions:", emailVerify.role?.permissions);
    console.log("Permissions Length:", emailVerify.role?.permissions?.length);
    console.log("=================================");

    const roleName = emailVerify.role?.role;

    // Next.js user portal: Student only
    if (portal === "user" && roleName !== "Student") {
      return res.status(403).json({
        status: false,
        message: "Only students are authorized to log in through this portal.",
      });
    }

    // Admin dashboard: SuperAdmin, Admin and Student
    if (
      portal === "admin" && !roleName) {
      return res.status(403).json({
        status: false,
        message: "Your assigned role does not have access to this portal.",
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
        userId: emailVerify._id,
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

    // Fetch the active forgot password email template
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

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });

    userEmail.otp = otp;
    userEmail.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await userEmail.save();

    // Replace {{otp}} in the template with the actual OTP
    const emailHtml = emailTemplate.content.replace(/\{\{otp\}\}/g, otp);

    // Send email using the saved template
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
    path: "/"
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

    //Find account in User collection first
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

    // verify current password
    const vaildPassword = await bcrypt.compare(currentPassword, userAccount.password);

    if (!vaildPassword) {
      return res.status(400).json({
        status: false,
        message: "Your current password is incorrect.",
      });
    }

    //Prevent using the same password
    const samePassword = await bcrypt.compare(newPassword, userAccount.password);

    if (samePassword) {
      return res.status(400).json({
        status: false,
        message: "Your new password must be different from your current password.",
      });
    }

    // hash and save new password
    userAccount.password = await bcrypt.hash(newPassword, 10);
    await userAccount.save();

    return res.status(200).json({
      status: true,
      message: "Your password has been changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error :", error);

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
  logoutUser
};
