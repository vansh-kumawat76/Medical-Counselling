const express = require("express");
const router = express.Router();

const auth = require("../auth");
const { createCounsellingSession, GetAllCounsellingSession, GetSingleCounsellingSession, StartCounsellingSession, CompleteCounsellingSession } = require("../controllers/CounsellingSessionController");

router.post("/CounsellingSession",auth, createCounsellingSession);
router.get("/GetAllCounsellingSession",auth, GetAllCounsellingSession);
router.get(
    "/get-Single-Counselling-Session/:sessionId",
    auth,
    GetSingleCounsellingSession
);
router.put(
    "/start-Counselling-Session/:sessionId",
    auth,
    StartCounsellingSession
);
router.put(
    "/complete-Counselling-Session/:sessionId",
    auth,
    CompleteCounsellingSession
);
module.exports = router;