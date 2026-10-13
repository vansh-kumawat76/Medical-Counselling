const express = require('express');
const auth = require('../auth');
const { CollegeController, GetCollegeController, EditCollegeHandler, DeleteCollegeHandler, SearchCollegeController } = require('../controllers/CollegeController');
const router = express.Router();

router.post("/Add-New-College",auth, CollegeController);
router.get("/Get-All-Colleges", auth, GetCollegeController);
router.put("/Edit-College",auth, EditCollegeHandler);
router.delete("/Delete-College",auth, DeleteCollegeHandler);
router.get("/Search-Colleges",auth, SearchCollegeController);
// router.get("/Filter-Students", FilterCollegeController)
module.exports = router