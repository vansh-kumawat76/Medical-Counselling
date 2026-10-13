
const mongoose = require("mongoose");
const Role = require("./models/Role");
const Permission = require("./models/Permission");

const permissions = [
  { name: "student.create", resource: "student", action: "create" },
  { name: "student.view", resource: "student", action: "view" },
  { name: "student.update", resource: "student", action: "update" },
  { name: "student.delete", resource: "student", action: "delete" },

  { name: "university.create", resource: "university", action: "create" },
  { name: "university.view", resource: "university", action: "view" },
  { name: "university.update", resource: "university", action: "update" },
  { name: "university.delete", resource: "university", action: "delete" },

  { name: "college.create", resource: "college", action: "create" },
  { name: "college.view", resource: "college", action: "view" },
  { name: "college.update", resource: "college", action: "update" },
  { name: "college.delete", resource: "college", action: "delete" },

  { name: "role.manage", resource: "role", action: "manage" },
];

async function seedRoles() {
  try {
    await mongoose.connect("mongodb://localhost:27017/LiveProject");

    // Permissions create karo ya existing records reuse karo
    const permissionIds = {};

    for (const item of permissions) {
      const permission = await Permission.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        { returnDocument : "after", upsert: true, runValidators: true }
      );

      permissionIds[item.name] = permission._id;
    }

    // Role-wise permissions
    const allPermissionIds = Object.values(permissionIds);

    const rolePermissions = {
      SuperAdmin: allPermissionIds,

      Admin: [
        permissionIds["student.create"],
        permissionIds["student.view"],
        permissionIds["student.update"],
        permissionIds["student.delete"],
        permissionIds["university.view"],
        permissionIds["college.view"],
      ],

      Student: [
        permissionIds["student.view"],
      ],
    };

    for (const [roleName, ids] of Object.entries(rolePermissions)) {
      await Role.findOneAndUpdate(
        { role: roleName },
        { $set: { role: roleName, permissions: ids } },
        { new: true, upsert: true, runValidators: true }
      );
    }

    console.log("Roles and permissions seeded successfully");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedRoles();