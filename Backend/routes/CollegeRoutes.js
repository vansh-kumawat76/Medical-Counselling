
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const checkPermission = require("../middleware/permission");
const upload = require("../middleware/upload");

const {
  CollegeController,
  GetCollegeController,
  EditCollegeHandler,
  DeleteCollegeHandler,
  SearchCollegeController,
} = require("../controllers/CollegeController");

const BulkCollegeImportController = require("../controllers/BulkCollegeImportController");

router.post(
  "/Add-New-College",
  auth,
  checkPermission("college.create"),
  upload.single("logo"),
  CollegeController
);

// Bulk import colleges
router.post(
  "/Bulk-Import-Colleges",
  auth,
  checkPermission("college.create"),
  BulkCollegeImportController
);

router.get(
  "/Get-All-Colleges",
  auth,
  GetCollegeController
);

router.put(
  "/Edit-College",
  auth,
  checkPermission("college.update"),
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
