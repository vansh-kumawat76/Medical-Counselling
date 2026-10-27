
const otpGenerator = require("otp-generator");
const User = require("../models/User");
const transport = require("../config/mailer");
const EmailTemplate = require("../models/EmailTemplate");
const generateOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    const emailTemplate = await EmailTemplate.findOne({
      slug : "otp-verification",
      status : "active"
    })

    if(!emailTemplate) {
      return res.status(500).send({
        status : false,
        message : "OTP email template not found or inactive"
      })
    }

    const emailHtml = emailTemplate.content.replace(
      /\{\{otp\}\}/g,
      otp
    )
     
    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: emailTemplate.subject,
      text: `Your OTP is ${otp}`,
      html: emailHtml,
    });

    return res.send({
      status: true,
      message: "OTP generated and sent successfully",
    });
  } catch (error) {
    console.log("OTP Generate Error:", error);

    return res.status(500).send({
      status: false,
      message: "Something went wrong",
    });
  }
};


const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const verifyEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!verifyEmail) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    if (String(verifyEmail.otp) !== String(otp)) {
      return res.status(400).send({
        status: false,
        message: "Invalid OTP",
      });
    }

    if (
      verifyEmail.otpExpiresAt &&
      verifyEmail.otpExpiresAt < new Date()
    ) {
      return res.status(400).send({
        status: false,
        message: "OTP expired. Please request a new OTP",
      });
    }

    return res.send({
      status: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
};


module.exports = { generateOtp , verifyOtp};
