
const mongoose = require("mongoose");
const Role = require("./models/Role");
const Permission = require("./models/Permission");
require("dotenv").config();

const permissions = [
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
];

async function seedRoles() {
  try {
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
    await Role.findOneAndUpdate(
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

    // Admin gets all counselling permissions
    // Existing permissions are preserved
    const counsellingPermissionIds = permissions
      .filter((item) =>
        [
          "counsellingRequest",
          "counsellingAssignment",
          "appointment",
          "counsellingSession",
          "counsellingNotes",
          "followUp",
        ].includes(item.resource)
      )
      .map((item) => permissionIds[item.name]);

    await Role.findOneAndUpdate(
      { role: "Admin" },
      {
        $setOnInsert: {
          role: "Admin",
        },
        $addToSet: {
          permissions: { $each: counsellingPermissionIds },
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    // Student gets limited permissions
    // Existing permissions are preserved
    const studentPermissionIds = [
      permissionIds["student.view"],
      permissionIds["counsellingRequest.create"],
      permissionIds["counsellingRequest.view"],
      permissionIds["appointment.create"],
      permissionIds["appointment.view"],
    ];

    await Role.findOneAndUpdate(
      { role: "Student" },
      {
        $setOnInsert: {
          role: "Student",
        },
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
    // Existing permissions are preserved
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
    ];

    await Role.findOneAndUpdate(
      { role: "Counsellor" },
      {
        $setOnInsert: {
          role: "Counsellor",
        },
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
    console.log("Student permissions assigned");
    console.log("Counsellor permissions assigned");
    console.log("SuperAdmin has all permissions");

  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected");
  }
}

seedRoles();
