
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
        message: "Please provide students data.",
      });
    }

    if (students.length > 500) {
      return res.status(400).json({
        status: false,
        message: "Maximum 500 students can be imported at once.",
      });
    }

    const studentRole = await Role.findOne({ role: "Student" });

    if (!studentRole) {
      return res.status(400).json({
        status: false,
        message: "Student role not found.",
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
          throw new Error("Name, email and phone are required.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Invalid email address.");
        }

        if (!/^\d{10}$/.test(phone)) {
          throw new Error("Phone must contain exactly 10 digits.");
        }

        if (importedEmails.has(email)) {
          throw new Error("Duplicate email in this CSV file.");
        }

        if (importedPhones.has(phone)) {
          throw new Error("Duplicate phone in this CSV file.");
        }

        const existingStudent = await Students.findOne({
          $or: [{ email }, { phone: Number(phone) }],
        });

        if (existingStudent) {
          throw new Error("Email or phone already exists.");
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
            ? "Student created and email sent."
            : "Student created, but email failed.",
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
      message: "Bulk import completed.",
      total: students.length,
      successful,
      failed: students.length - successful,
      results,
    });
  } catch (error) {
    console.error("Bulk student import error:", error);

    return res.status(500).json({
      status: false,
      message: "Bulk import failed.",
    });
  }
};

module.exports = BulkStudentImportController;
