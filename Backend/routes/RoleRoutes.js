
const express = require("express");

const {
  createRole,
  getRoles,
  deleteRole,
  getRolesPermissions,
} = require("../controllers/RoleController");

const auth = require("../auth");
const superAdmin = require("../middleware/isSuperAdmin");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const router = express.Router();

router.post("/create-role", auth, superAdmin, createRole);

router.get("/Get-Roles", auth, cacheMiddleware(300), getRoles);

router.delete("/delete-role/:id", auth, superAdmin, deleteRole);
router.get("/permissions", auth, getRolesPermissions);
module.exports = router;
