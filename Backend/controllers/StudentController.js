const bcrypt = require("bcrypt");
const Students = require("../models/Students");
const Role = require("../models/Role")
async function StudentController(req, res) {
  try {
    const { name, email, phone, password, status } = req.body;

    // Required fields check
    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        status: false,
        message: "Name, email, phone and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Email check
    const existingEmail = await Students.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        status: false,
        message: "Email already exists",
      });
    }

    // Phone check
    const existingPhone = await Students.findOne({ phone });

    if (existingPhone) {
      return res.status(409).json({
        status: false,
        message: "Phone number already exists",
      });
    }

    // Find Student role
    const studentRole = await Role.findOne({
      role: "Student",
    });

    if (!studentRole) {
      return res.status(500).json({
        status: false,
        message: "Student role not found",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create student
    const createdStudent = await Students.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password: hashPassword,
      role: studentRole._id,
      status: status || "pending",
    });

    // Remove password from response
    const studentData = createdStudent.toObject();
    delete studentData.password;

    return res.status(201).json({
      status: true,
      message: "Student created successfully",
      student: studentData,
    });
  } catch (error) {
    console.error("Student Creation Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "Student creation failed",
    });
  }
}
async function GetStudentController(req, res) {

    try {

        // 1. URL se page aur limit lena
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        // 2. Kitne documents skip karne hain
        const skip = (page - 1) * limit;

        // 3. Students fetch karna
        const getStudents = await Students.find().select("-password").populate("role")
            .skip(skip)
            .limit(limit);
        
        // 4. Total students count
        const totalStudents = await Students.countDocuments();

        // 5. Total pages
        const totalPages = Math.ceil(totalStudents / limit);

        return res.send({
            status: true,
            message: "Data successfully get",

            currentPage: page,
            limit: limit,
            totalStudents: totalStudents,
            totalPages: totalPages,

            getStudents: getStudents
        });

    } catch (error) {

        console.log(error);

        return res.status(500).send({
            status: false,
            message: "Students data not found",
            error: error.message
        });
    }
}
async function EditHandler(req, res) {
  const { email, name, phone, status} = req.body;

  const verifyEmail = await Students.findOne({ email });

  if (!verifyEmail) {
    return res.send({
      status: false,
      message: "Student Not Found !",
    });
  }
  const studentEdit = await Students.findByIdAndUpdate(
    verifyEmail._id,
    {
      name: name,
      phone: phone,
      ...(status !== undefined && {status : status.toLowerCase()})
    },
    {
      new: true,
    },
  );
  if (!studentEdit) {
    return res.send({
      status: false,
      message: "Student data not updated",
    });
  }
  return res.send({
    status: true,
    message: "Student data Edit successfully",
    student: studentEdit,
  });
}

async function DeleteHandler(req, res) {
  const { email } = req.body;

  const deletedStudent = await Students.findOneAndDelete({ email });
  if (!deletedStudent) {
    return res.send({
      status: false,
      message: "student not found",
    });
  }
  return res.send({
    status: true,
    message: "Student deleted successfully",
  });
}

async function SearchStudentController(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const { role, status } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const sortFields = ["name", "email", "phone", "role", "status", "createdAt"];
    const sortBy = sortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

    const order = req.query.order === "desc" ? -1 : 1;

    // Search by name, email, or phone
    const filter = {};

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];

      filter.$or = searchConditions;
    }

    // Filter by status
    if (status && status.trim()) {
      filter.status = {
        $regex : `^${status.trim()}$`,
        $options : "i"
    }
  }
    // Filter by role (role is an ObjectId reference)
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
      .sort({ [sortBy]: order })
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
      message: "Search failed",
    });
  }
}
async function FilterStudentController(req, res) {

    try {

        const { role, status } = req.query;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        // MongoDB filter object
        let filter = {};

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = {
              $regex:`${status.trim()}$`,
              $options : "i"
        };
      }
        // Total matching students
        const totalStudents = await Students.countDocuments(filter);

        // Students according to filter + pagination
        const students = await Students.find(filter).select("-password").populate("role")
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalStudents / limit);

        return res.send({

            status: true,

            message: "Students filtered successfully",

            currentPage: page,

            limit: limit,

            totalStudents: totalStudents,

            totalPages: totalPages,

            students: students

        });

    } catch (error) {

        console.log(error);

        return res.status(500).send({

            status: false,

            message: "Filter failed",

            error: error.message

        });

    }
}




module.exports = {
  StudentController,
  GetStudentController,
  EditHandler,
  DeleteHandler,
  SearchStudentController,
  FilterStudentController
};
