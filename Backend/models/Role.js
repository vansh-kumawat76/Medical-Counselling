const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    role : {
        type : String,
        // enum : ["SuperAdmin", "Admin", "Student"],
        default : "Student",
        required : true,
        unique : true
    },
    permissions : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Permission"
    },
],
})
module.exports = mongoose.model("Role", roleSchema)