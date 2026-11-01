
const express = require("express");
const router = express.Router();
const auth = require("../auth")
const checkPermission = require("../middleware/permission")
const { createUser, verifyEmail, getAllUsers, getSingleUser, updateUser } = require("../controllers/UserController");

router.post("/create-user", createUser);
router.post("/verify-email", verifyEmail);
router.get("/users", auth, checkPermission("user.view"), getAllUsers);
router.get( "/users/:id", auth, checkPermission("user.view"),getSingleUser);
router.put("/users/:id", auth, checkPermission("user.edit"), updateUser);
module.exports = router;
