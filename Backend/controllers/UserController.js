const bcrypt = require("bcrypt");
const Role = require("../models/Role");
const User = require("../models/User");
const Students = require("../models/Students");
const StudentProfile = require("../models/StudentProfile");
// const StudentProfile = require("../models/StudentProfile");
// ==================== CREATE USER API ====================

const createUser =  async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        status: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existuser = await User.findOne({
      email: normalizedEmail,
    });

  
    if (existuser) {
      return res.status(409).send({
        status: false,
        message: "User already exists",
      });
    }

    const studentRole = await Role.findOne({
      role: "Student",
    });

    if (!studentRole) {
      return res.status(500).send({
        status: false,
        message: "Student role not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
  email: normalizedEmail,
  password: hashPassword,
  role: studentRole._id,
});

await StudentProfile.create({
  user: newUser._id
});

    return res.status(201).send({
      status: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("Create User Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
};

// ==================== VERIFY EMAIL API ====================

const verifyEmail =  async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let verifyEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (!verifyEmail) {
      verifyEmail = await Students.findOne({
        email: normalizedEmail,
      });
    }

    if (!verifyEmail) {
      return res.status(404).send({
        status: false,
        message: "Email not found",
      });
    }

    return res.send({
      status: true,
      message: "Email is verified",
    });
  } catch (error) {
    console.log("Verify Email Error:", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
};

module.exports = {createUser, verifyEmail};
