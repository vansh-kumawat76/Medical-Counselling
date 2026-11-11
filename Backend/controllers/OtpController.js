
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
        message: "Please provide your email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "No account was found with the provided email address.",
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
      slug: "otp-verification",
      status: "active",
    });

    if (!emailTemplate) {
      return res.status(500).send({
        status: false,
        message: "The OTP email template is unavailable or inactive. Please contact support.",
      });
    }

    const emailHtml = emailTemplate.content.replace(
      /\{\{otp\}\}/g,
      otp
    );

    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: emailTemplate.subject,
      text: `Your OTP is ${otp}`,
      html: emailHtml,
    });

    return res.send({
      status: true,
      message: "A one-time password (OTP) has been generated and sent to your registered email address.",
    });
  } catch (error) {
    console.log("OTP Generate Error:", error);

    return res.status(500).send({
      status: false,
      message: "We couldn't process your OTP request. Please try again later.",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        status: false,
        message: "Please provide both your email address and OTP.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const verifyEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!verifyEmail) {
      return res.status(404).send({
        status: false,
        message: "No account was found with the provided email address.",
      });
    }

    if (String(verifyEmail.otp) !== String(otp)) {
      return res.status(400).send({
        status: false,
        message: "The OTP you entered is invalid. Please check it and try again.",
      });
    }

    if (
      verifyEmail.otpExpiresAt &&
      verifyEmail.otpExpiresAt < new Date()
    ) {
      return res.status(400).send({
        status: false,
        message: "Your OTP has expired. Please request a new one.",
      });
    }

    return res.send({
      status: true,
      message: "Your OTP has been verified successfully.",
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);

    return res.status(500).send({
      status: false,
      message: "We couldn't verify your OTP. Please try again later.",
    });
  }
};

module.exports = { generateOtp, verifyOtp };
