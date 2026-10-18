require("dotenv").config();
const Permission = require("./models/Permission");
const checkPermission = require("./middleware/permission");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer')
const auth = require("./auth.js");
const student = require("./routes/StudentRoutes")
const college = require("./routes/CollegeRoutes.js")
const univeristy = require("./routes/University.js")
const Role = require("./models/Role")
const User = require("./models/User");
const permissionRoutes = require("./routes/Permisson")
const roleRoutes = require("./routes/RoleRoutes.js")
const streamRoutes = require("./routes/StreamRoutes.js")
const degree = require("./routes/DegreeRoutes")
const course = require("./routes/CourseRoutes.js")
const specializationRoutes = require("./routes/SpecializationRoutes");
const app = express();

app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.status(200).send("Server is working");
});

app.use(cors({
  origin :[
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  credentials : true,
}));
app.use(express.json());
app.use(require("cookie-parser")());
app.use(student);
app.use(college);
app.use(univeristy);

// Role and Permission Routes
app.use("/roles", permissionRoutes);
app.use("/roles", roleRoutes);

// Other Routes
app.use(streamRoutes);
app.use(degree);
app.use(course);
app.use(specializationRoutes);

const transport = nodemailer.createTransport({
  service : "gmail",
  auth : {
    user : process.env.SMTP_USER,
    pass : process.env.SMTP_PASS
  }
})

mongoose
  .connect("mongodb://localhost:27017/LiveProject")
  .then(() => console.log("database is connected"))
  .catch((err) => console.log("error"));

// CREATE-USER API 
app.post("/create-user", async(req,res)=>{
  console.log("CREATE USER API HIT")
try {
  const {email,password} = req.body

  const existuser = await User.findOne({email});
    console.log("Email received:",email);
    console.log("Existing user:",existuser);
    console.log("Connected database:", mongoose.connection.name);
    console.log("User collection :", User.collection.name);
  if(existuser) {
    return res.send({
      status:false,
      message : "User alreday exists"
    })
  }
  const hashPassword = await bcrypt.hash(password,10);
  const studentRole = await Role.findOne({role : "Student"});
  if(!studentRole) {
    return res.status(500).send({
      status : false,
      message : "Student role not found"
    })
  }
  const createUser = await User.create({email,password : hashPassword, role : studentRole._id});

  return res.send({
    status : true,
    message : "User created successfully",
  })
}
catch(error) {
  console.log("Create User Error>>>>", error);
  return res.status(500).send({
    status : false,
    message : "Server error"
  })
}
})

//Verify-EMAIL API
app.post("/verify-email", async (req, res) => {
  const { email } = req.body;
  console.log("email>>>>>...", email);
   
  const verifyEmail = await User.findOne({ email });
  console.log("Full User>>>>>>>>>>", verifyEmail);
  console.log("db Password>>>>>>>", verifyEmail?.password)
  if (!verifyEmail)
    return res.send({
      status: false,
      message: "Email is not verify",
    });
  return res.send({
    status: true,
    message: "Email is verify",
  });
});

//OTP-GENRATOR API

app.post("/otp-generate", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const saveOtp = await User.findOneAndUpdate({email}, {otp},{
      new : true,
      upsert : true
    })

    console.log("OTP Saved>>>>", saveOtp)

    await transport.sendMail({
      from : process.env.SMTP_USER,
      to : email,
      subject : "welcome to my page",
      text : `Your OTP is ${otp}`,
      html : `<h1>OTP : ${otp}</h1>`
    })

    return res.send({
      status: true,
      message: "OTP generated and sent successfully",
      otp: otp,
    });


  } catch (error) {
    console.log("OTP Generate Error >>>>>", error);

    return res.status(500).send({
      status: false,
      message: "Something went wrong",
    });
  }
});

//VERIFY-OTP API
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("Email from body >>>", email);
    console.log("OTP from body >>>", otp);

  const verifyEmail = await User.findOne({email})

    console.log("Saved OTP >>>", verifyEmail);

    if (!verifyEmail) {
      return res.send({
        status: false,
        message: "OTP not found",
      });
    }

    if (String(verifyEmail.otp) !== String(otp)) {
      return res.send({
        status: false,
        message: "Invalid OTP",
      });
    }

  

    return res.send({
      status: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Verify OTP Error >>>", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

//LOGIN api

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;

  const emailVerify = await User.findOne({ email }).populate({
    path : "role",
    populate : {
      path : "permissions",
      model : "Permission"
    }
  });
  console.log("Email received :", email);
  console.log("emailVerify>>>>>>>", emailVerify);

  if (!emailVerify) {
    return res.send({
      status: false,
      message: "email doesn't found",
    });
  
  }
console.log("password >>>", password);
console.log("emailVerify >>>", emailVerify);
console.log("emailVerify.password >>>", emailVerify?.password);

  const verifyPassword = await bcrypt.compare(password, emailVerify.password);

  if (!verifyPassword) {
    return res.send({
      status: false,
      message: "Password incorrect",
    });
  }

  const token = jwt.sign(
  {
    email: emailVerify.email,
    role: emailVerify.role.role,
    permissions: emailVerify.role.permissions.map((permission) => permission.name),
  },
  "gpTech",
  { expiresIn: "30d" }
);
  console.log(token);
  res.cookie("token", token, {
    httpOnly : true,
    secure : false,
    sameSite : "lax",
    maxAge : 30*24*60*60*1000,
    path:"/"
  })
  return res.send({
    status: true,
    message: "login Successfully",
    emailVerify,
    token: token,
  });
});

//DASHBOARD API
app.get("/dashboard", auth, (req, res) => {
 return res.send({
    status: true,
    message: "welcome to the dashbord",
  });
});

// FORGET PASSWORD API

app.post("/forget-password", async (req, res) => {
  try {
    const { email } = req.body;

    const userEmail = await User.findOne({ email });

    if (!userEmail) {
      return res.send({
        status: false,
        message: "Invalid email",
      });
    }

    const otp = otpGenerator.generate(6, {
      specialChars: false,
    });

    userEmail.otp = otp;

    await userEmail.save();

    console.log("OTP Saved >>>>>>>", userEmail);

   await transport.sendMail({
      from:process.env.SMTP_USER,
      to : email,
      subject : "OTP",
       text : `Forget Password OTP is ${otp}`,
      html : `<h1>OTP : ${otp}</h1>`
    })

    return res.send({
      status: true,
      message: "OTP generated successfully",
      otp: otp,
    });
  } catch (error) {
    console.log("Forget Password Error >>>>>>>", error);

    return res.send({
      status: false,
      message: "Something went wrong",
    });
  }
});

// VERIFY-FORGET-OTP API

app.post("/verify-forget-otp", async (req, res) => {
  try {
    console.log("REQ BODY >>>>>>>", req.body);
    const { email, otp } = req.body;

    console.log("Email Recived>>>", email);
    console.log("OTP Recived>>>", otp);

    const userForgetUser = await User.findOne({ email });

    console.log("User Found >>>", userForgetUser);

    // User check
    if (!userForgetUser) {
      return res.send({
        status: false,
        message: "User not found",
      });
    }

    console.log("DB OTP >>>", userForgetUser.otp);
    console.log("RECEIVED OTP >>>", otp);

    // OTP check
    if (String(userForgetUser.otp) !== String(otp)) {
      return res.send({
        status: false,
        message: "Invalid OTP",
      });
    }

    // OTP verified
    return res.send({
      status: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Verify OTP Error >>>", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

// RESET PASSWORD API

app.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Email >>>", email);
    console.log("New Password >>>", password);

    const user = await User.findOne({ email });

    if (!user) {
      return res.send({
        status: false,
        message: "User not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    user.password = hashPassword;

    await user.save();

    return res.send({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("Reset Password Error >>>", error);

    return res.status(500).send({
      status: false,
      message: "Server error",
    });
  }
});

app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.send("Server is working");
});

app.get(
  "/students/test",
  auth,
  checkPermission("student.view"),
  (req, res) => {
    res.json({
      status: true,
      message: "Students read permission granted"
    });
  }
);

// Get all roles with their permissions
app.get("/roles-permissions", auth, async(req,res)=>{
  try {
     const roles = await Role.find().populate("permissions");
     const permissions = await Permission.find();
     return res.status(200).json({
      status : true,
      message : "Roles & permissions fetched successfully",
      roles,
      permissions:permissions
     })
  }
  catch(error) {
    console.log("Roles Permissions Error:", error);
    return res.status(500).json({
      status : false,
      message : "Failed to fetch roles & permissions",
    })
  }
})

app.get(
  "/students/delete-test",
  auth,
  checkPermission("student.delete"),
  
  (req, res) => {
    console.log("Logged-in email:", req.user.email);
console.log("Logged-in role:", req.user.role);
    res.json({
      status: true,
      message: "Student delete permission granted"
    });
  }
);

app.listen(8090, () => {
  console.log("server is started");
});
