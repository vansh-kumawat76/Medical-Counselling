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
module.exports = {
    createRole
}