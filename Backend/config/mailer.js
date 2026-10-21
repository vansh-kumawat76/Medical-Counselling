const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
    service : "gmail",
    auth : {
        user:process.env.SMTP_USER,
        pass : process.env.SMTP_PASS,
    }
})

module.exports = transport;