const express = require('express');
const auth = require('../auth');
const { CollegeController, GetCollegeController, EditCollegeHandler, DeleteCollegeHandler, SearchCollegeController } = require('../controllers/CollegeController');
const router = express.Router();
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
router.post("/Add-New-College",auth, upload.single("logo"), CollegeController);
router.get("/Get-All-Colleges", auth, GetCollegeController);
router.put("/Edit-College",auth, EditCollegeHandler);
router.delete("/Delete-College",auth, DeleteCollegeHandler);
router.get("/Search-Colleges",auth, SearchCollegeController);
// router.get("/Filter-Students", FilterCollegeController)
module.exports = router