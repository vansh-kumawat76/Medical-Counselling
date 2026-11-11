
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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

const BulkStudentImportController = async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide valid student data for import.",
      });
    }

    if (students.length > 500) {
      return res.status(400).json({
        status: false,
        message: "You can import a maximum of 500 students at a time.",
      });
    }

    const studentRole = await Role.findOne({ role: "Student" });

    if (!studentRole) {
      return res.status(400).json({
        status: false,
        message: "The Student role could not be found.",
      });
    }

    const results = [];
    const importedEmails = new Set();
    const importedPhones = new Set();

    for (let i = 0; i < students.length; i++) {
      const row = students[i];

      try {
        const name = String(row.name || "").trim();
        const email = String(row.email || "").trim().toLowerCase();
        const phone = String(row.phone || "").trim();

        if (!name || !email || !phone) {
          throw new Error("Please provide the student's name, email address, and phone number.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Please provide a valid email address.");
        }

        if (!/^\d{10}$/.test(phone)) {
          throw new Error("The phone number must contain exactly 10 digits.");
        }

        if (importedEmails.has(email)) {
          throw new Error("This email address is duplicated within the import file.");
        }

        if (importedPhones.has(phone)) {
          throw new Error("This phone number is duplicated within the import file.");
        }

        const existingStudent = await Students.findOne({
          $or: [{ email }, { phone: Number(phone) }],
        });

        if (existingStudent) {
          throw new Error("A student with this email address or phone number already exists.");
        }

        const password = generator.generate({
          length: 12,
          numbers: true,
          uppercase: true,
          lowercase: true,
          symbols: true,
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await Students.create({
          name,
          email,
          phone: Number(phone),
          password: hashedPassword,
          role: studentRole._id,
          status: "active",
        });

        importedEmails.add(email);
        importedPhones.add(phone);

        let emailSent = false;

        try {
          await transport.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Your Student Account Details",
            text: `Hello ${name},

Your student account has been created successfully.

Email: ${email}
Temporary Password: ${password}

Please log in and change your password.`,
          });

          emailSent = true;
        } catch (emailError) {
          console.error(`Email failed for ${email}:`, emailError.message);
        }

        results.push({
          row: i + 1,
          name,
          email,
          status: "success",
          emailSent,
          studentId: student._id,
          message: emailSent
            ? "The student account has been created successfully, and the login details have been sent via email."
            : "The student account has been created successfully, but the email could not be sent.",
        });
      } catch (rowError) {
        results.push({
          row: i + 1,
          name: row.name || "",
          email: row.email || "",
          status: "failed",
          message: rowError.message,
        });
      }
    }

    const successful = results.filter(
      (item) => item.status === "success"
    ).length;

    return res.status(200).json({
      status: true,
      message: "The bulk student import process has been completed.",
      total: students.length,
      successful,
      failed: students.length - successful,
      results,
    });
  } catch (error) {
    console.error("Bulk student import error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to complete the bulk student import. Please try again later.",
    });
  }
};

module.exports = BulkStudentImportController;
