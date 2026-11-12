
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Students = require("./models/Students");
const UserSession = require("./models/UserSession");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token =
      (authHeader && authHeader.split(" ")[1]) ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Authentication token is required.",
      });
    }

    const decode = jwt.verify(token, "gpTech");

    // Validate session ID
    if (!decode.sessionId) {
      return res.status(401).json({
        status: false,
        message: "Invalid session. Please log in again.",
      });
    }

    // Find active and non-expired session
    const session = await UserSession.findOne({
      sessionId: decode.sessionId,
      userId: decode.userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({
        status: false,
        message: "Your session has expired or has been terminated. Please log in again.",
      });
    }

    // Check student account deactivation
    if (decode.role === "Student") {
      const AccountModel =
        session.accountModel === "Students" ? Students : User;

      const student = await AccountModel.findById(decode.userId);

      if (!student) {
        return res.status(404).json({
          status: false,
          message: "Student account not found.",
        });
      }

      if (student.accountStatus === "deactivated") {
        return res.status(403).json({
          status: false,
          message: "Your account has been deactivated. Access to student services is currently restricted. Please contact support for assistance.",
        });
      }
    }

    // Update last active time
    await UserSession.updateOne(
      { _id: session._id },
      { $set: { lastActiveAt: new Date() } }
    );

    req.user = decode;

    next();
  } catch (error) {
    console.error("Authentication Error:", error);

    return res.status(401).json({
      status: false,
      message: "Your authentication token is invalid or has expired. Please log in again.",
    });
  }
};

module.exports = auth;
