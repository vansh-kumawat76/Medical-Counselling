const User = require("../models/User");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      const user = await User.findOne({
        email: req.user.email,
      }).populate({
        path: "role",
        populate: {
          path: "permissions",
        },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          status: false,
          message: "Role not found",
        });
      }

      console.log("User Role:", user.role.role);
      console.log("Required Permission:", requiredPermission);

      // SuperAdmin gets full access
      if (user.role.role === "SuperAdmin") {
        console.log("SuperAdmin: Full access granted");
        return next();
      }

      // Check permissions for other roles
      const hasPermission = user.role.permissions.some(
        (permission) => permission.name === requiredPermission
      );

      console.log(
        "Assigned Permissions:",
        user.role.permissions.map((permission) => permission.name)
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: false,
          message: "Permission denied",
        });
      }

      return next();
    } catch (error) {
      console.error("Permission middleware error:", error);

      return res.status(500).json({
        status: false,
        message: "Server error",
      });
    }
  };
};

module.exports = checkPermission;
