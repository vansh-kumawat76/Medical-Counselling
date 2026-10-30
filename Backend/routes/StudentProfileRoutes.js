const express = require('express');
const {updateStudentProfile, getStudentProfile } = require('../controllers/StudentProfileController');
const router = express.Router();
const auth = require("../auth")

router.put("/Edit-studentProfile",auth,updateStudentProfile);
router.get("/Get-studentProfile", auth, getStudentProfile)
module.exports = router