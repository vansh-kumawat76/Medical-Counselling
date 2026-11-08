
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const { CreateFeedback, GetAllFeedback, GetSingleFeedback, UpdateFeedback, DeleteFeedback } = require("../controllers/Feedback");


router.post("/Create-Feedback", auth, CreateFeedback);

router.get("/Get-All-Feedback", auth, GetAllFeedback);

router.get("/Get-Single-Feedback/:id", auth, GetSingleFeedback);

router.put("/Update-Feedback/:id", auth, UpdateFeedback);

router.delete("/Delete-Feedback/:id", auth, DeleteFeedback);

module.exports = router;
