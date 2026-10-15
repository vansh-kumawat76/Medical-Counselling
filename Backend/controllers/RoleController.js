const Role = require("../models/Role");
async function createRole(req,res) {
    try {
    const {role} = req.body
    console.log(role);

   if(!role) {
   return res.send({
        status : false,
        message : "role is empty"
    })
   }

   if(role !== "SuperAdmin" &&
     role !== "Admin" && role !== "Student") {
        return res.send({
            status : false,
            message : "Not Allowed role"
        })
    }
   const checkRole = await Role.findOne({role});

   if(checkRole) {
   return res.send({
        status : false,
        message : "Role already exist",
    })
   }
   const createRole = await Role.create({role});
   if(createRole) {
   return res.send({
        status : true,
        message : "Role Created Successfully",
        role : createRole
    })
   }
}
   catch(error) {
    console.log(error);
    return res.send({
       status : false,
       message : "Role doesn't created"
    })
}
}

async function getRoles(req,res) {
    try {
        const roles = await Role.find({ role : {$ne : "SuperAdmin"}})
        return res.status(200).json({
            status : true,
            message : "Roles fetched successfully",
            roles
        })
    }
    catch(error) {
        console.log("Get roles error:", error);

        return res.status(500).json({
            status : false,
            message : "Failed to fetch roles"
        })
    }
}

module.exports = {
    createRole,
    getRoles
}