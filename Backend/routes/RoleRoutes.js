const express = require("express");
const { createRole } = require("../controllers/RoleController");
const auth = require("../auth");
const superAdmin = require("../middleware/isSuperAdmin");

const router = express.Router();

router.post("/create-role", auth, superAdmin, createRole);

module.exports = router;
