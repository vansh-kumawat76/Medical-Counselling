const Contact = require("../models/Contact");

async function ContactController(req,res) {
    try{
    const {name,email, phone, enquiryType, subject, message} = req.body
    console.log(name,email, phone, enquiryType, subject, message);

    const contactUserCreate = await Contact.create({name,email, phone, enquiryType, subject, message})

    if(contactUserCreate) {
        return res.status(201).send({
            status : true,
            message : "contact enquiry submitted successfully",
            contact : contactUserCreate
        })
    }
}
catch(error){
return res.status(500).send({
    status : false,
    message : "Internal server error"
})
}
}

module.exports = {
    ContactController
}