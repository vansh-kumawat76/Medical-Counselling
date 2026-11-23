
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const checkPermission = require("../middleware/permission");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const {
  createCollegeReview,
  getCollegeReviews,
  getMyCollegeReviews,
  updateCollegeReview,
  deleteCollegeReview,
  getAllCollegeReviews,
  approveCollegeReview,
  rejectCollegeReview,
  adminDeleteCollegeReview
} = require("../controllers/CollegeReviewController");

// Only Student Can Access Review Actions
const studentOnly = (req, res, next) => {
  if (req.user?.role !== "Student") {
    return res.status(403).json({
      success: false,
      message: "Only students can submit or manage college reviews."
    });
  }

  next();
};


// ===============================
// STUDENT ROUTES
// ===============================

// Create College Review
router.post(
  "/create-review",
  auth,
  studentOnly,
  createCollegeReview
);

// Get Approved Reviews of College
router.get(
  "/college/:collegeId",
  cacheMiddleware(300),
  getCollegeReviews
);

// Get Logged-in Student Reviews
router.get(
  "/my-reviews",
  auth,
  studentOnly,
  getMyCollegeReviews
);

// Update Own Review
router.put(
  "/update/:reviewId",
  auth,
  studentOnly,
  updateCollegeReview
);

// Delete Own Review
router.delete(
  "/delete/:reviewId",
  auth,
  studentOnly,
  deleteCollegeReview
);


// ===============================
// ADMIN ROUTES
// ===============================

// Get All College Reviews
router.get(
  "/admin/all-reviews",
  auth,
  checkPermission("collegeReview.view"),
  getAllCollegeReviews
);

// Approve College Review
router.put(
  "/admin/approve/:reviewId",
  auth,
  checkPermission("collegeReview.approve"),
  approveCollegeReview
);

// Reject College Review
router.put(
  "/admin/reject/:reviewId",
  auth,
  checkPermission("collegeReview.reject"),
  rejectCollegeReview
);

// Delete Any College Review
router.delete(
  "/admin/delete/:reviewId",
  auth,
  checkPermission("collegeReview.delete"),
  adminDeleteCollegeReview
);

module.exports = router;
