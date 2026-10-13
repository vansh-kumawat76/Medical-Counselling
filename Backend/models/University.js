const mongoose = require('mongoose')

const universitySchema = new mongoose.Schema({
    
    name : {
        type : String,
        required : true
    },

    shortName : String,
    logo : String,

    type : {
    type : String,
    enum : ["central", "state", "private","deemed","international"]
    },
    establishedYear : Number,
    location : {
        city : String,
        state : String,
        country : String
    },
    website : String,
    
},
{
    timestamps : true
}
)

module.exports = mongoose.model("University", universitySchema)