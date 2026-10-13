const User = require("../models/User");

const superAdmin = async(req,res,next) =>{
    try {
const {email} = req.user
console.log(email);

if(!email) {
    return res.status(401).send({
        status : false,
        message : "email exist"
    })
}

const userFind = await User.findOne({email}).populate("role") 

if(!userFind) {
    return res.status(401).send({
      status : false,
    message : "user not found"
    })
    
}
if(userFind.role.role !== "SuperAdmin") {
return res.status(403).send({
    status : false,
    message : "Access denied"
})

}

next()
    }catch(error) {
       return res.status(500).send({
            status : false,
            message : "Internal server error" 
        })
    }
}

module.exports = superAdmin