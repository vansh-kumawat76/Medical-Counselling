const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer')
const auth = require("./auth.js");
const app = express();
app.use(cors());
app.use(express.json());

const transport = nodemailer.createTransport({
  service : "gmail",
  auth : {
    user : "vanshkumawat2106@gmail.com",
    pass : "kimlykbcplsvklns"
  }
})

mongoose
  .connect("mongodb://localhost:27017/LiveProject")
  .then(() => console.log("database is connected"))
  .catch((err) => console.log("error"));

//desgin schema

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  otp: String,
  password: String,
  
});



// User model
const User = mongoose.model("User", userSchema);

// CREATE-USER API 
app.post("/create-user", async(req,res)=>{
try {
  const {email,password} = req.body

  const existuser = await User.findOne({email});

  if(existuser) {
    return res.send({
      status:false,
      message : "User alreday exists"
    })
  }
  const hashPassword = await bcrypt.hash(password,10);
  const createUser = await User.create({email,password : hashPassword});

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
      from : "vanshkumawat2106@gmail.com",
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

  const emailVerify = await User.findOne({ email });
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

  const token = jwt.sign({ email: emailVerify.email }, "gpTech", {
    expiresIn: "9d",
  });
  console.log(token);
  res.send({
    status: true,
    message: "login Successfully",
    emailVerify,
    token: token,
  });
});

//DASHBOARD API
app.get("/dashboard", auth, (req, res) => {
  res.send({
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
      from:"vanshkumawat2106@gmail.com",
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

app.listen(8090, () => {
  console.log("server is started");
});
