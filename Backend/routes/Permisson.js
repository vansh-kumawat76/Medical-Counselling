const express = require("express");
const {
  PermissionController,
} = require("../controllers/PermissionController");
const auth = require("../auth");

const router = express.Router();

router.put("/:id/permissions", auth, PermissionController);

module.exports = router;
