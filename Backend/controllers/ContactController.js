
const Contact = require("../models/Contact");

async function ContactController(req, res) {
  try {
    const { name, email, phone, enquiryType, subject, message } = req.body;
    console.log(name, email, phone, enquiryType, subject, message);

    const contactUserCreate = await Contact.create({
      name,
      email,
      phone,
      enquiryType,
      subject,
      message
    });

    if (contactUserCreate) {
      return res.status(201).send({
        status: true,
        message: "Your contact enquiry has been submitted successfully.",
        contact: contactUserCreate
      });
    }
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: "An internal server error occurred. Please try again later."
    });
  }
}

async function GetAllContacts(req, res) {
  try {
    const contacts = await Contact.find().sort({ _id: -1 });

    return res.status(200).send({
      status: true,
      message: "Contact enquiries have been retrieved successfully.",
      contacts,
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: "An internal server error occurred. Please try again later.",
    });
  }
}

module.exports = {
  ContactController,
  GetAllContacts
};
