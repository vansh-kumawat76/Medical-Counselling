
const mongoose = require("mongoose");
const Role = require("./models/Role");
const Permission = require("./models/Permission");
const User = require("./models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();

// SuperAdmin Credentials
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

const permissions = [
  // User
  { name: "user.create", resource: "user", action: "create" },
  { name: "user.view", resource: "user", action: "view" },
  { name: "user.update", resource: "user", action: "update" },
  { name: "user.delete", resource: "user", action: "delete" },

  // Student
  { name: "student.create", resource: "student", action: "create" },
  { name: "student.view", resource: "student", action: "view" },
  { name: "student.update", resource: "student", action: "update" },
  { name: "student.delete", resource: "student", action: "delete" },

  // University
  { name: "university.create", resource: "university", action: "create" },
  { name: "university.view", resource: "university", action: "view" },
  { name: "university.update", resource: "university", action: "update" },
  { name: "university.delete", resource: "university", action: "delete" },

  // College
  { name: "college.create", resource: "college", action: "create" },
  { name: "college.view", resource: "college", action: "view" },
  { name: "college.update", resource: "college", action: "update" },
  { name: "college.delete", resource: "college", action: "delete" },

  // Role
  { name: "role.manage", resource: "role", action: "manage" },

  // Counselling Request
  { name: "counsellingRequest.create", resource: "counsellingRequest", action: "create" },
  { name: "counsellingRequest.view", resource: "counsellingRequest", action: "view" },
  { name: "counsellingRequest.update", resource: "counsellingRequest", action: "update" },
  { name: "counsellingRequest.delete", resource: "counsellingRequest", action: "delete" },

  // Counselling Assignment
  { name: "counsellingAssignment.create", resource: "counsellingAssignment", action: "create" },
  { name: "counsellingAssignment.view", resource: "counsellingAssignment", action: "view" },
  { name: "counsellingAssignment.update", resource: "counsellingAssignment", action: "update" },
  { name: "counsellingAssignment.delete", resource: "counsellingAssignment", action: "delete" },

  // Appointment
  { name: "appointment.create", resource: "appointment", action: "create" },
  { name: "appointment.view", resource: "appointment", action: "view" },
  { name: "appointment.update", resource: "appointment", action: "update" },
  { name: "appointment.delete", resource: "appointment", action: "delete" },

  // Counselling Session
  { name: "counsellingSession.create", resource: "counsellingSession", action: "create" },
  { name: "counsellingSession.view", resource: "counsellingSession", action: "view" },
  { name: "counsellingSession.update", resource: "counsellingSession", action: "update" },
  { name: "counsellingSession.delete", resource: "counsellingSession", action: "delete" },

  // Counselling Notes
  { name: "counsellingNotes.create", resource: "counsellingNotes", action: "create" },
  { name: "counsellingNotes.view", resource: "counsellingNotes", action: "view" },
  { name: "counsellingNotes.update", resource: "counsellingNotes", action: "update" },
  { name: "counsellingNotes.delete", resource: "counsellingNotes", action: "delete" },

  // Follow Up
  { name: "followUp.create", resource: "followUp", action: "create" },
  { name: "followUp.view", resource: "followUp", action: "view" },
  { name: "followUp.update", resource: "followUp", action: "update" },
  { name: "followUp.delete", resource: "followUp", action: "delete" },

  // College Course
  { name: "collegeCourse.create", resource: "collegeCourse", action: "create" },
  { name: "collegeCourse.view", resource: "collegeCourse", action: "view" },
  { name: "collegeCourse.update", resource: "collegeCourse", action: "update" },
  { name: "collegeCourse.delete", resource: "collegeCourse", action: "delete" },

  // College Recommendation
  { name: "collegeRecommendation.create", resource: "collegeRecommendation", action: "create" },
  { name: "collegeRecommendation.view", resource: "collegeRecommendation", action: "view" },
  { name: "collegeRecommendation.update", resource: "collegeRecommendation", action: "update" },
  { name: "collegeRecommendation.share", resource: "collegeRecommendation", action: "share" },
  { name: "collegeRecommendation.respond", resource: "collegeRecommendation", action: "respond" },

    // College Review
  { name: "collegeReview.view", resource: "collegeReview", action: "view" },
  { name: "collegeReview.approve", resource: "collegeReview", action: "approve" },
  { name: "collegeReview.reject", resource: "collegeReview", action: "reject" },
  { name: "collegeReview.delete", resource: "collegeReview", action: "delete" },
];

async function seedRoles() {
  try {
    if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
      throw new Error(
        "Please configure SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in your .env file."
      );
    }

    if (SUPERADMIN_PASSWORD.length < 8) {
      throw new Error("SuperAdmin password must contain at least 8 characters.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");

    // Create or update permissions
    const permissionIds = {};

    for (const item of permissions) {
      const permission = await Permission.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      permissionIds[item.name] = permission._id;
    }

    const allPermissionIds = Object.values(permissionIds);

    // SuperAdmin gets ALL permissions
    const superAdminRole = await Role.findOneAndUpdate(
      { role: "SuperAdmin" },
      {
        $set: {
          role: "SuperAdmin",
          permissions: allPermissionIds,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    console.log("SuperAdmin Email:", SUPERADMIN_EMAIL);
    console.log("SuperAdmin Role ID:", superAdminRole._id);

    // Create or verify SuperAdmin User
    let superAdminUser = await User.findOne({
      email: SUPERADMIN_EMAIL,
    });

    console.log("Seed DB:", mongoose.connection.name);
console.log("Seed User Found:", !!superAdminUser);
console.log("Seed Email:", superAdminUser?.email);
console.log("Seed User ID:", superAdminUser?._id);

    if (superAdminUser) {
      console.log("SuperAdmin account already exists.");

      if (
        superAdminUser.role.toString() !==
        superAdminRole._id.toString()
      ) {
        throw new Error(
          "SuperAdmin email belongs to another role."
        );
      }

      console.log("Email Match:", superAdminUser.email === SUPERADMIN_EMAIL);
      console.log("Password Exists:", !!superAdminUser.password);
      console.log(
        "Password Hash Prefix:",
        superAdminUser.password?.substring(0, 7)
      );

      const passwordMatch = await bcrypt.compare(
        SUPERADMIN_PASSWORD,
        superAdminUser.password || ""
      );

      console.log("Seed Password Match:", passwordMatch);

      console.log("Existing SuperAdmin account preserved.");
    } else {
      const hashedPassword = await bcrypt.hash(
        SUPERADMIN_PASSWORD,
        10
      );

      superAdminUser = await User.create({
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        role: superAdminRole._id,
      });

      console.log("SuperAdmin account created successfully.");
      console.log("Created Email:", superAdminUser.email);
      console.log("Password Exists:", !!superAdminUser.password);
      console.log(
        "Password Hash Prefix:",
        superAdminUser.password?.substring(0, 7)
      );
    }

// College Review permissions for Admin
const collegeReviewPermissionIds = [
  permissionIds["collegeReview.view"],
  permissionIds["collegeReview.approve"],
  permissionIds["collegeReview.reject"],
  permissionIds["collegeReview.delete"],
];
    // Admin gets all counselling permissions
    // College Recommendation: VIEW only

    const counsellingPermissionIds = permissions
      .filter((item) =>
        [
          "counsellingRequest",
          "counsellingAssignment",
          "appointment",
          "counsellingSession",
          "counsellingNotes",
          "followUp",
          "collegeCourse",
        ].includes(item.resource)
      )
      .map((item) => permissionIds[item.name]);

    await Role.findOneAndUpdate(
      { role: "Admin" },
      {
        $setOnInsert: { role: "Admin" },
        $addToSet: {
          permissions: {
            $each: [
              ...counsellingPermissionIds,
              ...collegeReviewPermissionIds,
              permissionIds["collegeRecommendation.view"],
              permissionIds["user.view"],
            ],
          },
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    // Remove extra College Recommendation permissions from Admin
    await Role.updateOne(
      { role: "Admin" },
      {
        $pull: {
          permissions: {
            $in: [
              permissionIds["collegeRecommendation.create"],
              permissionIds["collegeRecommendation.update"],
              permissionIds["collegeRecommendation.share"],
              permissionIds["collegeRecommendation.respond"],
            ],
          },
        },
      }
    );

    // Student gets limited permissions
    const studentPermissionIds = [
      permissionIds["student.view"],
      permissionIds["counsellingRequest.create"],
      permissionIds["counsellingRequest.view"],
      permissionIds["appointment.create"],
      permissionIds["appointment.view"],
      permissionIds["collegeRecommendation.view"],
      permissionIds["collegeRecommendation.respond"],
    ];

    await Role.findOneAndUpdate(
      { role: "Student" },
      {
        $setOnInsert: { role: "Student" },
        $addToSet: {
          permissions: { $each: studentPermissionIds },
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    // Counsellor gets counselling-related permissions
    const counsellorPermissionIds = [
      permissionIds["counsellingRequest.view"],
      permissionIds["counsellingAssignment.view"],
      permissionIds["appointment.view"],
      permissionIds["appointment.update"],
      permissionIds["counsellingSession.create"],
      permissionIds["counsellingSession.view"],
      permissionIds["counsellingSession.update"],
      permissionIds["counsellingNotes.create"],
      permissionIds["counsellingNotes.view"],
      permissionIds["counsellingNotes.update"],
      permissionIds["followUp.create"],
      permissionIds["followUp.view"],
      permissionIds["followUp.update"],
      permissionIds["collegeCourse.view"],
      permissionIds["collegeRecommendation.create"],
      permissionIds["collegeRecommendation.view"],
      permissionIds["collegeRecommendation.update"],
      permissionIds["collegeRecommendation.share"],
      permissionIds["user.view"],
    ];

    await Role.findOneAndUpdate(
      { role: "Counsellor" },
      {
        $setOnInsert: { role: "Counsellor" },
        $addToSet: {
          permissions: { $each: counsellorPermissionIds },
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    console.log("Roles and permissions seeded successfully");
    console.log("Total permissions:", allPermissionIds.length);
    console.log("Counselling permissions:", counsellingPermissionIds.length);
    console.log("Admin counselling permissions assigned");
    console.log("Admin College Recommendation: VIEW only");
    console.log("Student permissions assigned");
    console.log("Counsellor permissions assigned");
    console.log("SuperAdmin has all permissions");

  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Database disconnected");
    }
  }
}

seedRoles();
