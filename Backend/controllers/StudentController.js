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
        const getStudents = await Students.find().select("-password")
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
  const { email, name, phone } = req.body;

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

        // Search value
        const search = String(req.query.search || "");
        const sortBy = req.query.sortBy || "createdAt";
        const order = req.query.order === "desc" ? -1 : 1;
        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        // Skip calculate
        const skip = (page - 1) * limit;

        // Search query
        let searchQuery = [
            {
                name: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                email: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];

        // Phone number ke liye
        if (search !== "" && !isNaN(Number(search))) {

            searchQuery.push({
                phone: Number(search)
            });

        }

        // Total matching students
        const totalStudents = await Students.countDocuments({
            $or: searchQuery
        });

        // Matching students + pagination
        const students = await Students.find({
            $or: searchQuery
        })
        .sort({[sortBy] : order})
        .skip(skip)
        .limit(limit);

        // Total pages
        const totalPages = Math.ceil(totalStudents / limit);

        return res.send({

            status: true,

            message: "Search successfully",

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

            message: "Search failed",

            error: error.message

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
            filter.status = status;
        }

        // Total matching students
        const totalStudents = await Students.countDocuments(filter);

        // Students according to filter + pagination
        const students = await Students.find(filter).select("-password")
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
