
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const checkPermission = require("../middleware/permission");

const {
  createCollegeRecommendation,
  getAllCollegeRecommendations,
  getSingleCollegeRecommendation,
  updateCollegeRecommendation,
  shareCollegeRecommendation,
  respondToCollegeRecommendation,
} = require("../controllers/collegeRecommendationController");

// Create College Recommendation
router.post(
  "/create-recommendation",
  auth,
  checkPermission("collegeRecommendation.create"),
  createCollegeRecommendation
);

// Get All College Recommendations
router.get(
  "/get-all-recommendations",
  auth,
  checkPermission("collegeRecommendation.view"),
  getAllCollegeRecommendations
);

// Get Single College Recommendation
router.get(
  "/get-single-recommendation/:id",
  auth,
  checkPermission("collegeRecommendation.view"),
  getSingleCollegeRecommendation
);

// Update College Recommendation
router.put(
  "/update-recommendation/:id",
  auth,
  checkPermission("collegeRecommendation.update"),
  updateCollegeRecommendation
);

// Share College Recommendation
router.post(
  "/share-recommendation/:id",
  auth,
  checkPermission("collegeRecommendation.share"),
  shareCollegeRecommendation
);

// Student Respond to Recommendation
router.post(
  "/respond-recommendation/:id",
  auth,
  checkPermission("collegeRecommendation.respond"),
  respondToCollegeRecommendation
);

module.exports = router;
