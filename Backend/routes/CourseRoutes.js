
const express = require("express");
const router = express.Router();

const auth = require("../auth");

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

// const BulkCourseImportController = require("../controllers/BulkCourseImportController");
console.log(typeof BulkCourseImportController);
// Add Course
router.post("/Add-New-Course", auth, AddCourseController);

// Get All Courses
router.get("/Get-All-Courses", GetAllCoursesController);

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

//Pagination Courses
router.get("/Pagination-Courses",auth,PaginationCourseController);

router.post("/Bulk-Import-Courses", BulkCourseImportController);
module.exports = router;
