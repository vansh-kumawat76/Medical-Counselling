const express = require('express');
const { CounsellingRequestController, GetCounsellingRequestController, AssigendToController, UpdateCounsellingRequestStatus } = require('../controllers/CounsellingRequestController');
const auth = require("../auth")
const router = express.Router();

router.post("/counselling-request",auth, CounsellingRequestController);
router.get("/getCounseller-request", auth, GetCounsellingRequestController);
router.post("/assign-request", auth, AssigendToController);
router.put("/update-request-status", auth, UpdateCounsellingRequestStatus);
module.exports = router