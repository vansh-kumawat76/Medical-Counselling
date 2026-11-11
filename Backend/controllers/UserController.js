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
        message: "Please provide both email address & password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existuser = await User.findOne({
      email: normalizedEmail,
    });

  
    if (existuser) {
      return res.status(409).send({
        status: false,
        message: "An account with this email address alreday exists.",
      });
    }

    const studentRole = await Role.findOne({
      role: "Student",
    });

    if (!studentRole) {
      return res.status(500).send({
        status: false,
        message: "The required account role is currently unavailable.",
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
      message: "Your account has been created successfully",
    });
  } catch (error) {
    console.log("Create User Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred. Please try again later",
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
        message: "Please provide an email address.",
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
        message: "No account was found with the provided email address.",
      });
    }

    return res.send({
      status: true,
      message: "The email address has been verified successfully.",
    });
  } catch (error) {
    console.log("Verify Email Error:", error);

    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred.Please try again later.",
    });
  }
};

// ==================== GET ALL USERS API ====================

const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = {};
    // Filter users by role
if (req.query.role) {
  const roleData = await Role.findOne({
    role: req.query.role,
  });

  if (!roleData) {
    return res.status(404).json({
      status: false,
      message: "The requested account role could not be found.",
    });
  }

  filter.role = roleData._id;
}

    // Search users by email
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.email = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    // Hide SuperAdmin from non-SuperAdmin users
    if (req.user.role !== "SuperAdmin") {
      const superAdminRole = await Role.findOne({
        role: "SuperAdmin",
      });

      if (superAdminRole) {
        filter.role = { $ne: superAdminRole._id };
      }
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password -otp -otpExpiresAt")
        .populate("role", "role")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: true,
      message: "User records retrieved successfully.",
      data: users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

// ==================== GET SINGLE USER API ====================

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        status: false,
        message: "The provided user ID is invalid.",
      });
    }

    const user = await User.findById(id)
      .select("-password -otp -otpExpiresAt")
      .populate("role", "role");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "No user account was found with the provided ID.",
      });
    }

    // Hide SuperAdmin from non-SuperAdmin users
    if (
      req.user.role !== "SuperAdmin" &&
      user.role?.role === "SuperAdmin"
    ) {
      return res.status(403).json({
        status: false,
        message: "You do not have permission to access this account.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "User details retrieved successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Get Single User Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};


// ==================== UPDATE USER API ====================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Validate MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        status: false,
        message: "The provided user ID is invalid.",
      });
    }

    // Email validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find existing user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "The requested user account could not be found.",
      });
    }

    // Prevent non-SuperAdmin from updating SuperAdmin
    const userRole = await Role.findById(user.role);

    if (
      req.user.role !== "SuperAdmin" &&
      userRole?.role === "SuperAdmin"
    ) {
      return res.status(403).json({
        status: false,
        message: "You do not have permission to modify this account.",
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    if (existingEmail) {
      return res.status(409).json({
        status: false,
        message: "An account with this email address already exists.",
      });
    }

    user.email = normalizedEmail;

    await user.save();

    return res.status(200).json({
      status: true,
      message: "User details have been updated successfully.",
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Update User Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

const createCounsellor = async (req, res) => {
  try {

    if (
  req.user.role !== "Admin" &&
  req.user.role !== "SuperAdmin"
) {
  return res.status(403).json({
    success: false,
    message: "You are not authorized to create a counsellor account.",
  });
}

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email address and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const counsellorRole = await Role.findOne({
      role: "Counsellor",
    });

    if (!counsellorRole) {
      return res.status(404).json({
        success: false,
        message: "The counsellor account role is currently unavailable.",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newCounsellor = await User.create({
      email: normalizedEmail,
      password: hashPassword,
      role: counsellorRole._id,
    });

    return res.status(201).json({
      success: true,
      message: "The counsellor account has been created successfully.",
      data: {
        id: newCounsellor._id,
        email: newCounsellor.email,
      },
    });
  } catch (error) {
    console.log("Create Counsellor Error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};
module.exports = {createUser, verifyEmail, getAllUsers, getSingleUser, updateUser, createCounsellor};
