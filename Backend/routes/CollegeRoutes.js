
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const checkPermission = require("../middleware/permission");
const upload = require("../middleware/upload");
const uploadCSV = require("../middleware/uploadCSV");
const {
  CollegeController,
  GetCollegeController,
  EditCollegeHandler,
  DeleteCollegeHandler,
  SearchCollegeController,
  GetOneCollegeController
} = require("../controllers/CollegeController");

const BulkCollegeImportController = require("../controllers/BulkCollegeImportController");

router.post(
  "/Add-New-College",
  auth,
  checkPermission("college.create"),
  upload.fields([
    {name : "logo", maxCount : 1},
    {name : "backgroundImage", maxCount : 1}
  ]),
  CollegeController
);

//temporary test route for testing
router.post("/test-bulk", (req,res)=>{
  console.log("Test Bulk route hit");
  res.json({
    success : true,
    message : "Route working",
  })
})

// Bulk import colleges
router.post(
  "/Bulk-Import-Colleges",
  auth,
  checkPermission("college.create"),
  uploadCSV.single("file"),
  BulkCollegeImportController
);

router.get(
  "/Get-All-Colleges",
  GetCollegeController
);


router.get(
  "/Get-One-Colleges/:slug",
  auth,
GetOneCollegeController
);

router.put(
  "/Edit-College",
  auth,
  checkPermission("college.update"),
  upload.fields([
     {name : "logo", maxCount : 1},
     {name : "backgroundImage", maxCount : 1},
  ]),
  EditCollegeHandler
);

router.delete(
  "/Delete-College",
  auth,
  checkPermission("college.delete"),
  DeleteCollegeHandler
);

router.get(
  "/Search-Colleges",
  auth,
  checkPermission("college.view"),
  SearchCollegeController
);

module.exports = router;
