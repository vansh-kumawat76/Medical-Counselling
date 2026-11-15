
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const checkPermission = require("../middleware/permission");

const {
  createCollegeCourse,
  getAllCollegeCourses,
  getSingleCollegeCourse,
  updateCollegeCourse,
  deleteCollegeCourse
} = require("../controllers/collegeCourseController");

// Create College Course
router.post(
  "/create-college-course",
  auth,
  checkPermission("collegeCourse.create"),
  createCollegeCourse
);

// Get All College Courses
router.get(
  "/get-all-college-courses",
  auth,
  checkPermission("collegeCourse.view"),
  getAllCollegeCourses
);

// Get Single College Course
router.get(
  "/get-single-college-course/:id",
  auth,
  checkPermission("collegeCourse.view"),
  getSingleCollegeCourse
);


router.put(
  "/update-college-course/:id",
  auth,
  checkPermission("collegeCourse.update"),
  updateCollegeCourse
);

router.delete(
  "/delete-college-course/:id",
  auth,
  checkPermission("collegeCourse.delete"),
  deleteCollegeCourse
);

module.exports = router;
