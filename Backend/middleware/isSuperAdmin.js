
const User = require("../models/User");

const superAdmin = async (req, res, next) => {
  try {
    const { email } = req.user || {};

    if (!email) {
      return res.status(401).json({
        status: false,
        message: "Authentication is required to access this resource.",
      });
    }

    const userFind = await User.findOne({ email }).populate("role");

    if (!userFind) {
      return res.status(401).json({
        status: false,
        message: "Your account could not be verified. Please sign in again.",
      });
    }

    if (!userFind.role || userFind.role.role !== "SuperAdmin") {
      return res.status(403).json({
        status: false,
        message: "You do not have the required permissions to perform this action.",
      });
    }

    next();
  } catch (error) {
    console.error("SuperAdmin authorization error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

module.exports = superAdmin;
