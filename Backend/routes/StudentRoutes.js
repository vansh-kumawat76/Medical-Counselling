const express = require("express");
const router = express.Router();
const auth = require("../auth");
const checkPermission = require("../middleware/permission")
const {
  StudentController,
  GetStudentController,
  EditHandler,
  DeleteHandler,
  SearchStudentController,
  FilterStudentController,
} = require("../controllers/StudentController");

router.post("/Add-New-Students",auth, checkPermission("student.create"), StudentController);
router.get("/Get-All-Students",auth, GetStudentController);
router.put("/Edit-Data",auth, checkPermission("student.update"), EditHandler);
router.delete("/deleted-student",auth, checkPermission("student.delete"), DeleteHandler);
router.get("/Search-Students",auth, checkPermission("student.view"), SearchStudentController);
router.get("/Filter-Students",auth, checkPermission("student.view"), FilterStudentController)
module.exports = router;
