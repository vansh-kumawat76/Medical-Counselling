
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
const {
  storeSessionInRedis,
  deleteSessionFromRedis,
  deleteUserSessionsFromRedis,
} = require("../config/sessionStore");
const { redisClient } = require("../config/redis");
const { jobQueue } = require("../config/queue");

const storeOtpInRedis = async (key, otp) => {
  if (!redisClient.isReady) {
    throw new Error("Redis is not available. Please try again later.");
  }

  await redisClient.setEx(key, 300, String(otp));
};

const getOtpFromRedis = async (key) => {
  if (!redisClient.isReady) {
    throw new Error("Redis is not available. Please try again later.");
  }

  return await redisClient.get(key);
};

const deleteOtpFromRedis = async (key) => {
  if (!redisClient.isReady) {
    throw new Error("Redis is not available. Please try again later.");
  }

  await redisClient.del(key);
};

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

  
const allowedAdminRoles = ["Admin", "SuperAdmin", "Counsellor"];

if (portal === "admin" && !allowedAdminRoles.includes(roleName)) {
  return res.status(403).json({
    status: false,
    message: "Only Admin, SuperAdmin and Counsellor are authorized to log in through this portal.",
  });
}

    //Update Last Login Time
    emailVerify.lastLoginAt = new Date();
    await emailVerify.save();

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

    const newSession = await UserSession.create({
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

// Store session in Redis
await storeSessionInRedis(newSession);
    const token = jwt.sign(
      {
        email: emailVerify.email,
        role: roleName,
        permissions,
        userId: emailVerify._id,
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

     const safeUser = {
  _id: emailVerify._id,
  email: emailVerify.email,
  role: emailVerify.role,
  lastLoginAt: emailVerify.lastLoginAt,
  passwordChangedAt: emailVerify.passwordChangedAt,
  createdAt: emailVerify.createdAt,
  updatedAt: emailVerify.updatedAt,
};

if (emailVerify.name !== undefined) {
  safeUser.name = emailVerify.name;
}

if (emailVerify.phone !== undefined) {
  safeUser.phone = emailVerify.phone;
}

if (emailVerify.accountStatus !== undefined) {
  safeUser.accountStatus = emailVerify.accountStatus;
}

if (emailVerify.status !== undefined) {
  safeUser.status = emailVerify.status;
}

    return res.status(200).json({
      status: true,
      message: "You have logged in successfully.",
      emailVerify : safeUser,
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


// ==================== ACCOUNT REACTIVATION OTP ====================

const requestReactivationOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).populate("role");

    if (!user || user.role?.role !== "Student") {
      return res.status(404).json({
        status: false,
        message: "Student account not found.",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password || ""
    );

    if (!validPassword) {
      return res.status(401).json({
        status: false,
        message: "The password you entered is incorrect.",
      });
    }

    if (user.accountStatus !== "deactivated") {
      return res.status(400).json({
        status: false,
        message: "Your account is already active.",
      });
    }

    const emailTemplate = await EmailTemplate.findOne({
      slug: "account-reactivation-otp",
      status: "active",
    });

    if (!emailTemplate) {
      return res.status(500).json({
        status: false,
        message: "The account reactivation email template is unavailable or inactive.",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });
await storeOtpInRedis(
  `otp:account-reactivation:${normalizedEmail}`,
  otp
);
    user.reactivationOtpAttempts = 0;
    user.reactivationOtpBlockedUntil = null;

    await user.save();

    const emailHtml = emailTemplate.content.replace(
      /\{\{otp\}\}/g,
      otp
    );

 try {
  await jobQueue.add("send-email", {
    to: normalizedEmail,
    subject: emailTemplate.subject,
    text: `Your account reactivation OTP is ${otp}`,
    html: emailHtml,
    otpKey: `otp:account-reactivation:${normalizedEmail}`,
  });
} catch (emailError) {
  await deleteOtpFromRedis(
    `otp:account-reactivation:${normalizedEmail}`
  );

  throw emailError;
}
    return res.status(200).json({
      status: true,
      message: "Account reactivation OTP has been sent to your registered email.",
    });
  } catch (error) {
    console.error("Request Reactivation OTP Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while requesting account reactivation.",
    });
  }
};


// ==================== VERIFY REACTIVATION OTP ====================

const verifyReactivationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and OTP.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Student account not found.",
      });
    }

    if (user.accountStatus !== "deactivated") {
      return res.status(400).json({
        status: false,
        message: "Your account is already active.",
      });
    }

    if (
      user.reactivationOtpBlockedUntil &&
      user.reactivationOtpBlockedUntil > new Date()
    ) {
      return res.status(429).json({
        status: false,
        message: "Too many incorrect OTP attempts. Please request a new OTP later.",
      });
    }

   const storedOtp = await getOtpFromRedis(
  `otp:account-reactivation:${normalizedEmail}`
);

if (!storedOtp) {
  return res.status(400).json({
    status: false,
    message: "The OTP has expired or is invalid. Please request a new OTP.",
  });
}
    if (String(storedOtp) !== String(otp)) {
      user.reactivationOtpAttempts =
        (user.reactivationOtpAttempts || 0) + 1;

      if (user.reactivationOtpAttempts >= 5) {
        user.reactivationOtpBlockedUntil = new Date(
          Date.now() + 15 * 60 * 1000
        );
      }

      await user.save();

      return res.status(400).json({
        status: false,
        message:
          user.reactivationOtpAttempts >= 5
            ? "Too many incorrect attempts. Please request a new OTP after 15 minutes."
            : "The OTP you entered is invalid.",
      });
    }

    // Reactivate account after successful OTP verification

    user.accountStatus = "active";
    user.reactivationOtpAttempts = 0;
    user.reactivationOtpBlockedUntil = null;

    await user.save();
  await deleteOtpFromRedis(
  `otp:account-reactivation:${normalizedEmail}`
);
    return res.status(200).json({
      status: true,
      message: "Your account has been reactivated successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Verify Reactivation OTP Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while verifying the reactivation OTP.",
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

    userEmail.otpAttempts = 0;
userEmail.otpBlockedUntil = null;

await storeOtpInRedis(
  `otp:forgot-password:${normalizedEmail}`,
  otp
);
   
    await userEmail.save();

    const emailHtml = emailTemplate.content.replace(/\{\{otp\}\}/g, otp);

    try {
  await jobQueue.add("send-email", {
    to: normalizedEmail,
    subject: emailTemplate.subject,
    text: `Forgot Password OTP is ${otp}`,
    html: emailHtml,
    otpKey: `otp:forgot-password:${normalizedEmail}`,
  });
} catch (emailError) {
  await deleteOtpFromRedis(
    `otp:forgot-password:${normalizedEmail}`
  );

  throw emailError;
}

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

    if (
  userForgetUser.otpBlockedUntil &&
  userForgetUser.otpBlockedUntil > new Date()
) {
  return res.status(429).json({
    status: false,
    message: "Too many incorrect OTP attempts. Please request a new OTP later.",
  });
}

const storedOtp = await getOtpFromRedis(
  `otp:forgot-password:${normalizedEmail}`
);

if (!storedOtp) {
  return res.status(400).send({
    status: false,
    message: "The OTP has expired. Please request a new one.",
  });
}

  if (String(storedOtp) !== String(otp)) {
 userForgetUser.otpAttempts =
  (userForgetUser.otpAttempts || 0) + 1;

  if (userForgetUser.otpAttempts >= 5) {
    userForgetUser.otpBlockedUntil = new Date(
      Date.now() + 15 * 60 * 1000
    );
  }

  await userForgetUser.save();

  return res.status(400).send({
    status: false,
    message:
      userForgetUser.otpAttempts >= 5
        ? "Too many incorrect attempts. Please request a new OTP after 15 minutes."
        : "The OTP you entered is invalid.",
  });
}

    const resetToken = jwt.sign(
      {
        email: userForgetUser.email,
        purpose: "reset-password",
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    userForgetUser.otpAttempts = 0;
userForgetUser.otpBlockedUntil = null;

    await userForgetUser.save();

    
     await deleteOtpFromRedis(
  `otp:forgot-password:${normalizedEmail}`
);


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
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
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
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate all active sessions after password reset
await UserSession.updateMany(
  {
    userId: user._id,
    isActive: true,
  },
  {
    $set: {
      isActive: false,
    },
  }
);

await deleteUserSessionsFromRedis(user._id);

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

const logoutUser = async (req, res) => {
  try {
    const { userId, sessionId } = req.user || {};

    if (!userId || !sessionId) {
      return res.status(401).json({
        status: false,
        message: "Invalid session. Please log in again.",
      });
    }

    // Deactivate current user session
    await UserSession.updateOne(
      {
        userId,
        sessionId,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

    await deleteSessionFromRedis(
  req.user.userId,
  req.user.sessionId
);

    // Clear authentication cookie
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
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while logging out.",
    });
  }
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
    userAccount.passwordChangedAt = new Date();
    await userAccount.save();

   // Invalidate all active sessions after password change
await UserSession.updateMany(
  {
    userId: userAccount._id,
    isActive: true,
  },
  {
    $set: {
      isActive: false,
    },
  }
);
await deleteUserSessionsFromRedis(userAccount._id);
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
  requestReactivationOtp,
  verifyReactivationOtp,
};
