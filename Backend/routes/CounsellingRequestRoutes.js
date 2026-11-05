const express = require('express');
const { CounsellingRequestController, GetCounsellingRequestController, AssigendToController, UpdateCounsellingRequestStatus, GetSingleCounsellingRequestController } = require('../controllers/CounsellingRequestController');
const auth = require("../auth")
const router = express.Router();

router.post("/counselling-request",auth, CounsellingRequestController);
router.get("/getCounseller-request", auth, GetCounsellingRequestController);
router.get("/get-single-request/:requestId",auth,GetSingleCounsellingRequestController);
router.post("/assign-request", auth, AssigendToController);
router.put("/update-request-status", auth, UpdateCounsellingRequestStatus);

module.exports = router