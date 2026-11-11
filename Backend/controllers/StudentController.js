
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Students = require("../models/Students");
const Role = require("../models/Role");
const generator = require("generate-password");
const nodemailer = require("nodemailer");
const EmailTemplate = require("../models/EmailTemplate")
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
      return { error: "The provided role ID is invalid." };
    }

    const selectedRole = await Role.findById(roleId);

    if (!selectedRole) {
      return { error: "The selected role could not be found." };
    }

    if (selectedRole.role === "SuperAdmin") {
      return {
        error: "The SuperAdmin role cannot be assigned through this operation.",
      };
    }

    return { role: selectedRole };
  }

  // If role is not sent, default to Student.
  const studentRole = await Role.findOne({ role: "Student" });

  if (!studentRole) {
    return { error: "The Student role is currently unavailable." };
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
        message: "Please provide the student's name, email address, and phone number.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid phone number containing exactly 10 digits.",
      });
    }

    const existingEmail = await Students.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        status: false,
        message: "An account with this email address already exists.",
      });
    }

    const existingPhone = await Students.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        status: false,
        message: "An account with this phone number already exists.",
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
  const emailTemplate = await EmailTemplate.findOne({
    slug: "student-registration",
    status: "active",
  });

  if (!emailTemplate) {
    throw new Error("Student registration email template not found or inactive");
  }

  const emailHtml = emailTemplate.content
    .replace(/\{\{name\}\}/g, name.trim())
    .replace(/\{\{email\}\}/g, normalizedEmail)
    .replace(/\{\{password\}\}/g, generatedPassword);

  await transport.sendMail({
    from: process.env.SMTP_USER,
    to: normalizedEmail,
    subject: emailTemplate.subject,
    text: `Hello ${name.trim()}, your student account has been created successfully. Email: ${normalizedEmail}. Temporary Password: ${generatedPassword}`,
    html: emailHtml,
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
        ? "The student account has been created successfully. Login details have been sent to the registered email address."
        : "The student account has been created, but the login email could not be sent. Please contact support for assistance.",
      student: studentData,
      emailSent,
    });
  } catch (error) {
    console.error("Student Creation Error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "We couldn't create the student account. Please try again later.",
    });
  }
}

// ================= GET ALL STUDENTS =================

async function GetStudentController(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const sortBy = String(req.query.sortBy || "createdAt");
    const order = String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;

    const allowedSortFields = ["name", "email", "phone", "role", "status", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const totalStudents = await Students.countDocuments();

    let getStudents;

    if (sortField === "role") {
      getStudents = await Students.aggregate([
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        {
          $unwind: {
            path: "$roleData",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { "roleData.role": order, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            password: 0,
          },
        },
        {
          $addFields: {
            role: "$roleData",
          },
        },
        {
          $project: {
            roleData: 0,
          },
        },
      ]);
    } else {
      getStudents = await Students.find()
        .select("-password")
        .populate("role")
        .sort({ [sortField]: order, _id: -1 })
        .skip(skip)
        .limit(limit);
    }

    return res.status(200).json({
      status: true,
      message: "Student records retrieved successfully.",
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
      message: "We couldn't retrieve the student records. Please try again later.",
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
        message: "Please provide the student's email address.",
      });
    }

    const existingStudent = await Students.findOne({
      email: normalizedEmail,
    });

    if (!existingStudent) {
      return res.status(404).json({
        status: false,
        message: "The requested student account could not be found.",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          status: false,
          message: "The student's name cannot be empty.",
        });
      }

      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      const normalizedPhone = String(phone).trim();

      if (!/^\d{10}$/.test(normalizedPhone)) {
        return res.status(400).json({
          status: false,
          message: "Please provide a valid phone number containing exactly 10 digits.",
        });
      }

      const duplicatePhone = await Students.findOne({
        phone: normalizedPhone,
        _id: { $ne: existingStudent._id },
      });

      if (duplicatePhone) {
        return res.status(409).json({
          status: false,
          message: "An account with this phone number already exists.",
        });
      }

      updateData.phone = normalizedPhone;
    }

   if (status !== undefined) {
  const normalizedStatus = String(status).toLowerCase();

  if (!["active", "inactive"].includes(normalizedStatus)) {
    return res.status(400).json({
      status: false,
      message: "Status must be either active or inactive.",
    });
  }

  updateData.status = normalizedStatus;
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
      message: "Student details have been updated successfully.",
      student: studentEdit,
    });
  } catch (error) {
    console.error("Edit Student Error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "We couldn't update the student account. Please try again later.",
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
        message: "The requested student account could not be found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The student account has been deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Student Error:", error);

    return res.status(500).json({
      status: false,
      message: "We couldn't delete the student account. Please try again later.",
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

    const sortBy = String(req.query.sortBy || "createdAt");
    const order = String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;

    const allowedSortFields = ["name", "email", "phone", "role", "status", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

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
          message: "Student records retrieved successfully.",
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

    let students;

    if (sortField === "role") {
      students = await Students.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        {
          $unwind: {
            path: "$roleData",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { "roleData.role": order, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            password: 0,
          },
        },
        {
          $addFields: {
            role: "$roleData",
          },
        },
        {
          $project: {
            roleData: 0,
          },
        },
      ]);
    } else {
      students = await Students.find(filter)
        .select("-password")
        .populate("role")
        .sort({ [sortField]: order, _id: -1 })
        .skip(skip)
        .limit(limit);
    }

    return res.status(200).json({
      status: true,
      message: "Student records retrieved successfully.",
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
      message: error.message || "We couldn't search student records. Please try again later.",
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
          message: "Student records filtered successfully.",
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
      message: "Student records filtered successfully.",
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
      message: error.message || "We couldn't filter student records. Please try again later.",
      error: error.message,
    });
  }
}

const studentPermissionTest = (req, res) => {
  res.json({
    status: true,
    message: "You have permission to view student records.",
  });
};

const studentDeletePermissionTest = (req, res) => {
  console.log("Logged-in email:", req.user.email);
  console.log("Logged-in role:", req.user.role);

  res.json({
    status: true,
    message: "You have permission to delete student records.",
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
