
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Students = require("../models/Students");
const Role = require("../models/Role");
const generator = require("generate-password");
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ================= ROLE HELPER =================

async function getSelectedRole(roleId) {
  if (roleId) {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return { error: "Invalid role ID" };
    }

    const selectedRole = await Role.findById(roleId);

    if (!selectedRole) {
      return { error: "Selected role not found" };
    }

    if (selectedRole.role === "SuperAdmin") {
      return {
        error: "SuperAdmin role cannot be assigned here",
      };
    }

    return { role: selectedRole };
  }

  // If role is not sent, default to Student.
  const studentRole = await Role.findOne({ role: "Student" });

  if (!studentRole) {
    return { error: "Student role not found" };
  }

  return { role: studentRole };
}

// ================= CREATE STUDENT =================

async function StudentController(req, res) {
  try {
    const { name, email, phone, status, role } = req.body;

    if (!name?.trim() || !email?.trim() || !phone) {
      return res.status(400).json({
        status: false,
        message: "Name, email and phone are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        status: false,
        message: "Phone number must contain exactly 10 digits",
      });
    }

    const existingEmail = await Students.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        status: false,
        message: "Email already exists",
      });
    }

    const existingPhone = await Students.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        status: false,
        message: "Phone number already exists",
      });
    }

    const roleResult = await getSelectedRole(role);

    if (roleResult.error) {
      return res.status(400).json({
        status: false,
        message: roleResult.error,
      });
    }

    const generatedPassword = generator.generate({
      length: 12,
      numbers: true,
      uppercase: true,
      lowercase: true,
      symbols: true,
    });

    const hashPassword = await bcrypt.hash(generatedPassword, 10);

    const createdStudent = await Students.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashPassword,
      role: roleResult.role._id,
      status: status || "pending",
    });

    let emailSent = true;

    try {
      await transport.sendMail({
        from: process.env.SMTP_USER,
        to: normalizedEmail,
        subject: "Your Account Login Details",
        text: `Hello ${name.trim()},

Your account has been created successfully.

Email: ${normalizedEmail}
Temporary Password: ${generatedPassword}

Please log in and change your password after your first login.

Regards,
University Management System`,
      });
    } catch (mailError) {
      emailSent = false;
      console.error("Account created, but email failed:", mailError);
    }

    await createdStudent.populate("role");

    const studentData = createdStudent.toObject();
    delete studentData.password;

    return res.status(201).json({
      status: true,
      message: emailSent
        ? "Account created successfully. Login details sent to email."
        : "Account created, but the login email could not be sent. Check SMTP configuration.",
      student: studentData,
      emailSent,
    });
  } catch (error) {
    console.error("Student Creation Error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Student creation failed",
    });
  }
}

// ================= GET ALL STUDENTS =================

async function GetStudentController(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const getStudents = await Students.find()
      .select("-password")
      .populate("role")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const totalStudents = await Students.countDocuments();

    return res.status(200).json({
      status: true,
      message: "Data successfully fetched",
      currentPage: page,
      limit,
      totalStudents,
      totalPages: Math.ceil(totalStudents / limit),
      getStudents,
    });
  } catch (error) {
    console.error("Get Students Error:", error);

    return res.status(500).json({
      status: false,
      message: "Students data not found",
      error: error.message,
    });
  }
}

// ================= EDIT STUDENT =================

async function EditHandler(req, res) {
  try {
    const { email, name, phone, status, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    const existingStudent = await Students.findOne({
      email: normalizedEmail,
    });

    if (!existingStudent) {
      return res.status(404).json({
        status: false,
        message: "Student not found",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          status: false,
          message: "Name cannot be empty",
        });
      }

      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      const normalizedPhone = String(phone).trim();

      if (!/^\d{10}$/.test(normalizedPhone)) {
        return res.status(400).json({
          status: false,
          message: "Phone number must contain exactly 10 digits",
        });
      }

      const duplicatePhone = await Students.findOne({
        phone: normalizedPhone,
        _id: { $ne: existingStudent._id },
      });

      if (duplicatePhone) {
        return res.status(409).json({
          status: false,
          message: "Phone number already exists",
        });
      }

      updateData.phone = normalizedPhone;
    }

    if (status !== undefined) {
      updateData.status = String(status).toLowerCase();
    }

    if (role !== undefined && role !== "") {
      const roleResult = await getSelectedRole(role);

      if (roleResult.error) {
        return res.status(400).json({
          status: false,
          message: roleResult.error,
        });
      }

      updateData.role = roleResult.role._id;
    }

    const studentEdit = await Students.findByIdAndUpdate(
      existingStudent._id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("role");

    return res.status(200).json({
      status: true,
      message: "Student updated successfully",
      student: studentEdit,
    });
  } catch (error) {
    console.error("Edit Student Error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Student update failed",
    });
  }
}

// ================= DELETE STUDENT =================

async function DeleteHandler(req, res) {
  try {
    const { email } = req.body;

    const deletedStudent = await Students.findOneAndDelete({
      email: email?.trim().toLowerCase(),
    });

    if (!deletedStudent) {
      return res.status(404).json({
        status: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete Student Error:", error);

    return res.status(500).json({
      status: false,
      message: "Student delete failed",
    });
  }
}

// ================= SEARCH STUDENTS =================

async function SearchStudentController(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const roleName = String(req.query.role || "").trim();
    const status = String(req.query.status || "").trim();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];

      if (/^\d+$/.test(search)) {
        filter.$or.push({ phone: Number(search) });
        filter.$or.push({ phone: search });
      }
    }

    if (status) {
      const escapedStatus = status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.status = {
        $regex: `^${escapedStatus}$`,
        $options: "i",
      };
    }

    if (roleName) {
      const escapedRole = roleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const foundRole = await Role.findOne({
        role: { $regex: `^${escapedRole}$`, $options: "i" },
      });

      if (!foundRole) {
        return res.status(200).json({
          status: true,
          message: "Students fetched successfully",
          currentPage: page,
          limit,
          totalPages: 0,
          totalStudents: 0,
          students: [],
        });
      }

      filter.role = foundRole._id;
    }

    const totalStudents = await Students.countDocuments(filter);

    const students = await Students.find(filter)
      .select("-password")
      .populate("role")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Students fetched successfully",
      currentPage: page,
      limit,
      totalStudents,
      totalPages: Math.ceil(totalStudents / limit),
      students,
    });
  } catch (error) {
    console.error("Search Students Error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Search failed",
    });
  }
}

// ================= FILTER STUDENTS =================

async function FilterStudentController(req, res) {
  try {
    const { role, status } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (role) {
      const escapedRole = String(role)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const foundRole = await Role.findOne({
        role: { $regex: `^${escapedRole}$`, $options: "i" },
      });

      if (!foundRole) {
        return res.status(200).json({
          status: true,
          message: "Students filtered successfully",
          currentPage: page,
          limit,
          totalStudents: 0,
          totalPages: 0,
          students: [],
        });
      }

      filter.role = foundRole._id;
    }

    if (status && String(status).trim()) {
      const escapedStatus = String(status)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.status = {
        $regex: `^${escapedStatus}$`,
        $options: "i",
      };
    }

    const totalStudents = await Students.countDocuments(filter);

    const students = await Students.find(filter)
      .select("-password")
      .populate("role")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Students filtered successfully",
      currentPage: page,
      limit,
      totalStudents,
      totalPages: Math.ceil(totalStudents / limit),
      students,
    });
  } catch (error) {
    console.error("Filter Students Error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Filter failed",
      error: error.message,
    });
  }
}


const studentPermissionTest = (req, res) => {
  res.json({
    status: true,
    message: "Students read permission granted",
  });
};


const studentDeletePermissionTest = (req, res) => {
  console.log("Logged-in email:", req.user.email);
  console.log("Logged-in role:", req.user.role);

  res.json({
    status: true,
    message: "Student delete permission granted",
  });
};



module.exports = {
  StudentController,
  GetStudentController,
  EditHandler,
  DeleteHandler,
  SearchStudentController,
  FilterStudentController,
  studentPermissionTest,
  studentDeletePermissionTest,
};
