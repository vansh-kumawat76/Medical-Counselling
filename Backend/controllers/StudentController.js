const bcrypt = require("bcrypt");
const Students = require("../models/Students");
const Role = require("../models/Role");
const generator = require("generate-password");
const nodemailer = require("nodemailer")

const transport = nodemailer.createTransport({
  service : "gmail",
  auth : {
    user : process.env.SMTP_USER,
    pass : process.env.SMTP_PASS
  }
})

// ================= CREATE STUDENT =================

async function StudentController(req, res) {
  try {
    const { name, email, phone, status } = req.body;

    if (!name?.trim() || !email?.trim() || !phone) {
      return res.status(400).json({
        status: false,
        message: "Name, email, phone and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await Students.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        status: false,
        message: "Email already exists",
      });
    }

    const existingPhone = await Students.findOne({ phone });

    if (existingPhone) {
      return res.status(409).json({
        status: false,
        message: "Phone number already exists",
      });
    }

    const studentRole = await Role.findOne({
      role: "Student",
    });

    if (!studentRole) {
      return res.status(500).json({
        status: false,
        message: "Student role not found",
      });
    }
   const generatedPassword = generator.generate({
    length : 12,
    numbers : true,
    uppercase : true,
    lowercase : true,
    symbols : true
   })
    const hashPassword = await bcrypt.hash(generatedPassword, 10);

    const createdStudent = await Students.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password: hashPassword,
      role: studentRole._id,
      status: status || "pending",
    });

console.log("SMTP_USER exists:", !!process.env.SMTP_USER);
console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

    await transport.sendMail({
      from : process.env.SMTP_USER,
      to : email,
      subject : "Your Student Account Login Details",
      text : `Hello ${name.trim()},
      Your student account has been created successfully.
      Email : ${email}
      Temporary Password : ${generatedPassword}
      Please log in and change your password after your first login.
      Regards,
      Univeristy Management System`,
    })

    const studentData = createdStudent.toObject();
    delete studentData.password;

    return res.status(201).json({
      status: true,
      message: "Student created successfully. Login details sent to email",
      student: studentData,
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
    const totalPages = Math.ceil(totalStudents / limit);

    return res.status(200).json({
      status: true,
      message: "Data successfully get",
      currentPage: page,
      limit,
      totalStudents,
      totalPages,
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
    const { email, name, phone, status } = req.body;

    const verifyEmail = await Students.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (!verifyEmail) {
      return res.status(404).json({
        status: false,
        message: "Student Not Found!",
      });
    }

    const updateData = {
      name,
      phone,
    };

    if (status !== undefined) {
      updateData.status = status.toLowerCase();
    }

    const studentEdit = await Students.findByIdAndUpdate(
      verifyEmail._id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("role");

    if (!studentEdit) {
      return res.status(400).json({
        status: false,
        message: "Student data not updated",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Student data edited successfully",
      student: studentEdit,
    });
  } catch (error) {
    console.error("Edit Student Error:", error);

    return res.status(500).json({
      status: false,
      message: "Student update failed",
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
    const role = String(req.query.role || "").trim();
    const status = String(req.query.status || "").trim();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    // Search by name, email, or phone
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];

      // Phone schema Number hai, isliye numeric search alag handle karo
      if (/^\d+$/.test(search)) {
        filter.$or.push({ phone: Number(search) });
      }
    }

    // Filter by status
    if (status) {
      filter.status = {
        $regex: `^${status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    // Filter by role
    if (role) {
      const foundRole = await Role.findOne({
        role: { $regex: `^${role}$`, $options: "i" },
      });

      if (!foundRole) {
        return res.status(200).json({
          status: true,
          message: "Students fetched successfully",
          currentPage: page,
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
      const foundRole = await Role.findOne({
        role: { $regex: `^${role.trim()}$`, $options: "i" },
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

    if (status && status.trim()) {
      filter.status = {
        $regex: `^${status.trim()}$`,
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
      message: "Filter failed",
      error: error.message,
    });
  }
}

module.exports = {
  StudentController,
  GetStudentController,
  EditHandler,
  DeleteHandler,
  SearchStudentController,
  FilterStudentController,
};
