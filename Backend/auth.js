
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Students = require("./models/Students");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token =
      (authHeader && authHeader.split(" ")[1]) ||
      req.cookies?.token;

    console.log("Token received:", token ? "Present" : "Missing");

    if (!token) {
      return res.status(401).json({
        status: false,
        message:
          "Authentication is required to access this resource. Please log in to continue.",
      });
    }

    const decode = jwt.verify(token, "gpTech");

    console.log("AUTH MIDDLEWARE HIT");
    console.log("JWT PAYLOAD:", decode);

    // Verify Student Account Status
    if (decode.role === "Student") {
      let student = await User.findById(decode.userId);

      // If not found in User collection, check Students collection
      if (!student) {
        student = await Students.findById(decode.userId);
      }

      if (!student) {
        return res.status(404).json({
          status: false,
          message:
            "Your student account could not be found. Please contact support for assistance.",
        });
      }

      if (student.accountStatus === "deactivated") {
        return res.status(403).json({
          status: false,
          message:
            "Your account has been deactivated. Access to student services is currently restricted. Please contact support for assistance.",
        });
      }
    }

    req.user = decode;

    console.log("Decoded JWT Payload:", decode);
    console.log(
      "Decoded JWT Payload:",
      JSON.stringify(req.user, null, 2)
    );

    next();
  } catch (error) {
    console.log("JWT Error:", error.message);

    return res.status(401).json({
      status: false,
      message:
        "Your authentication session is invalid or has expired. Please log in again to continue.",
    });
  }
};

module.exports = auth;
