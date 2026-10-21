
const mongoose = require("mongoose");
const Role = require("../models/Role");
const User = require("../models/User");
const Permission = require("../models/Permission");
async function createRole(req, res) {
  try {
    const { role } = req.body;

    if (typeof role !== "string" || !role.trim()) {
      return res.status(400).json({
        status: false,
        message: "Role name is required",
      });
    }

    const roleName = role.trim();

    if (roleName.toLowerCase() === "superadmin") {
      return res.status(400).json({
        status: false,
        message: "SuperAdmin role already exists",
      });
    }

    const checkRole = await Role.findOne({
      role: { $regex: `^${roleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (checkRole) {
      return res.status(409).json({
        status: false,
        message: "Role already exists",
      });
    }

    const createdRole = await Role.create({ role: roleName });

    return res.status(201).json({
      status: true,
      message: "Role created successfully",
      role: createdRole,
    });
  } catch (error) {
    console.error("Create Role Error:", error);

    return res.status(500).json({
      status: false,
      message: "Role could not be created",
    });
  }
}

async function getRoles(req, res) {
  try {
    const roles = await Role.find({
      role: { $ne: "SuperAdmin" },
    }).populate("permissions");

    return res.status(200).json({
      status: true,
      message: "Roles fetched successfully",
      roles,
    });
  } catch (error) {
    console.error("Get Roles Error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch roles",
    });
  }
}

async function deleteRole(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid role ID",
      });
    }

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Role not found",
      });
    }

    // Protect built-in roles
    const protectedRoles = ["superadmin", "admin", "student"];

    if (protectedRoles.includes(role.role.toLowerCase())) {
      return res.status(403).json({
        status: false,
        message: "Built-in roles cannot be deleted",
      });
    }

    // Do not delete a role that is assigned to any user
    const assignedUsers = await User.countDocuments({
      role: role._id,
    });

    if (assignedUsers > 0) {
      return res.status(409).json({
        status: false,
        message: `Cannot delete ${role.role}. It is assigned to ${assignedUsers} user(s). Change those users' roles first.`,
      });
    }

    await Role.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: `${role.role} role deleted successfully`,
    });
  } catch (error) {
    console.error("Delete Role Error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to delete role",
    });
  }
}

async function updateRolePermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid role ID",
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        status: false,
        message: "Permissions must be an array",
      });
    }

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Role is not found",
      });
    }

    const Permission = require("../models/Permission");

    const invalidIds = permissions.some(
      (permissionId) => !mongoose.isValidObjectId(permissionId)
    );

    if (invalidIds) {
      return res.status(400).json({
        status: false,
        message: "One or more permission IDs are invalid",
      });
    }

    const uniquePermissionIds = [...new Set(permissions.map(String))];

    const validPermissions = await Permission.find({
      _id: { $in: uniquePermissionIds },
    }).select("_id");

    if (validPermissions.length !== uniquePermissionIds.length) {
      return res.status(400).json({
        status: false,
        message: "One or more permissions do not exist",
      });
    }

    role.permissions = uniquePermissionIds;
    await role.save();

    const updatedRole = await Role.findById(id).populate("permissions");

    return res.status(200).json({
      status: true,
      message: "Role permissions updated successfully",
      role: updatedRole,
    });
  } catch (error) {
    console.error("Update Role Permissions Error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update role permissions",
    });
  }
}
const getRolesPermissions = async (req, res) => {
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
};

module.exports = {
  createRole,
  getRoles,
  deleteRole,
  updateRolePermissions,
  getRolesPermissions
};
