const mongoose = require("mongoose");
const Permission = require("../models/Permission");
const Role = require("../models/Role");
const User = require("../models/User");
async function PermissionController(req,res) {
    try {
        //only superAdmin can be updated
       
        const user = await User.findOne({
            email : req.user?.email,}).populate("role");

       if(!user || !user.role || user.role.role !== "SuperAdmin") {
        return res.status(403).json({
            status : false,
            message : "Only SuperAdmin can update permissions",
        })
       }
        
        const {id} = req.params;
        const {permissions} = req.body

        if(!Array.isArray(permissions)) {
            return res.status(400).json({
                status : false,
                message : "Permissions must be an  array of IDs",
            })
        }

        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                status : false,
                message : "Invalid role Id",
            })
        }
        const invalidPermissionId = permissions.some((permissonId)=>!mongoose.isValidObjectId(permissonId));

        if(invalidPermissionId) {
            return res.status(400).json({
                status : false,
                message : "Invalid permission ID"
            })
        }
        const uniquePermissionIds = [...new Set(permissions)];
        const permissionCount = await Permission.countDocuments({
            _id : {$in : uniquePermissionIds},
        })

        if(permissionCount !== uniquePermissionIds.length) {
            return res.status(400).json({
                status : false,
                message : "One or more permissions do not exist"
            })
        }
        const role = await Role.findByIdAndUpdate(id,
            {$set : {permissions : uniquePermissionIds}},
            {new : true, runValidators : true}
        ).populate("permissions");

        if(!role) {
            return res.status(404).json({
                status : false,
                message : "Role not found",
            })
        }
        return res.status(200).json({
                  status: true,
      message: "Permissions updated successfully",
      role,

        })
    }
catch (error) {
    console.error("Update permissions error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to update permissions",
    });
  }
}


module.exports = {
    PermissionController
}