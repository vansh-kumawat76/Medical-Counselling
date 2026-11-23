
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const checkPermission = require("../middleware/permission");

const {
  createCollegeCourse,
  getAllCollegeCourses,
  getSingleCollegeCourse,
  updateCollegeCourse,
  deleteCollegeCourse,
  getCollegeCoursesByCollege
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
  cacheMiddleware(300),
  getAllCollegeCourses
);

// Get Single College Course
router.get(
  "/get-single-college-course/:id",
  auth,
  checkPermission("collegeCourse.view"),
  getSingleCollegeCourse
);

router.get(
  "/get-college-courses/:collegeId",
  auth,
  checkPermission("collegeCourse.view"),
  getCollegeCoursesByCollege
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
