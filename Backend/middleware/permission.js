
const User = require("../models/User");
const Students = require("../models/Students");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({
          status: false,
          message: "Authentication is required to access this resource.",
        });
      }

      const email = req.user.email.trim().toLowerCase();

      // First search in User collection
      let user = await User.findOne({ email }).populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

      // If not found, search in Students collection
      if (!user) {
        user = await Students.findOne({ email }).populate({
          path: "role",
          populate: {
            path: "permissions",
            model: "Permission",
          },
        });
      }

      if (!user || !user.role) {
        return res.status(403).json({
          status: false,
          message: "Your account role could not be verified. Please contact support.",
        });
      }

      // SuperAdmin full access
      if (user.role.role === "SuperAdmin") {
        return next();
      }

      const assignedPermissions = user.role.permissions || [];

      const hasPermission = assignedPermissions.some(
        (permission) => permission.name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: false,
          message: "You do not have the required permissions to access this resource.",
        });
      }

      return next();
    } catch (error) {
      console.error("Permission middleware error:", error);

      return res.status(500).json({
        status: false,
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  };
};

module.exports = checkPermission;
