const express = require("express");
const router = express.Router();

const auth = require("../auth");
const uploadCSV = require("../middleware/uploadCSV");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const {
  AddCourseController,
  GetAllCoursesController,
  GetCourseByIdController,
  EditCourseController,
  DeleteCourseController,
  SearchCourseController,
  FilterCourseController,
  SortCourseController,
  PaginationCourseController,
} = require("../controllers/CourseController");

const BulkCourseImportController = require("../controllers/BulkCourseController");

console.log(typeof BulkCourseImportController);

// Add Course
router.post("/Add-New-Course", auth, AddCourseController);

// Get All Courses - Public
router.get("/Get-All-Courses", cacheMiddleware(300), GetAllCoursesController);

// Get Course By ID
router.get("/Get-Course-By-Id/:id", auth, GetCourseByIdController);

// Edit Course
router.put("/Edit-Course/:id", auth, EditCourseController);

// Delete Course
router.delete("/Delete-Course/:id", auth, DeleteCourseController);

// Search Courses
router.get("/Search-Courses", auth, SearchCourseController);

// Filter Courses
router.get("/Filter-Courses", auth, FilterCourseController);

// Sort Courses
router.get("/Sort-Courses", auth, SortCourseController);

// Pagination Courses - Public
router.get("/Pagination-Courses", PaginationCourseController);

// Bulk Import Courses
router.post(
  "/Bulk-Import-Courses",
  auth,
  uploadCSV.single("file"),
  BulkCourseImportController,
);

module.exports = router;
