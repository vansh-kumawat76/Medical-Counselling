
const express = require('express');

const {
  CounsellingRequestController,
  GetCounsellingRequestController,
  AssigendToController,
  UpdateCounsellingRequestStatus,
  GetSingleCounsellingRequestController
} = require('../controllers/CounsellingRequestController');

const auth = require("../auth");

const {
  counsellingRequestValidator
} = require("../validators/userValidator");

const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// Create Counselling Request with validation
router.post(
  "/counselling-request",
  auth,
  counsellingRequestValidator,
  validateRequest,
  CounsellingRequestController
);

// Get all Counselling Requests
router.get(
  "/getCounseller-request",
  auth,
  GetCounsellingRequestController
);

// Get Single Counselling Request
router.get(
  "/get-single-request/:requestId",
  auth,
  GetSingleCounsellingRequestController
);

// Assign Counselling Request
router.post(
  "/assign-request",
  auth,
  AssigendToController
);

// Update Counselling Request Status
router.put(
  "/update-request-status",
  auth,
  UpdateCounsellingRequestStatus
);

module.exports = router;
