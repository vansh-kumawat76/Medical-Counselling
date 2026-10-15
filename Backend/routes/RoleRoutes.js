const express = require("express");
const { createRole, getRoles } = require("../controllers/RoleController");
const auth = require("../auth");
const superAdmin = require("../middleware/isSuperAdmin");

const router = express.Router();

router.post("/create-role", auth, superAdmin, createRole);
router.get("/Get-Roles",auth, getRoles);

module.exports = router;
