const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  GetAllAssignmentsController,
  GetSingleAssignmentController,
  ReassignCounsellingController,
} = require("../controllers/CounsellingAssignmentController");

router.get("/get-all-assignments", auth, GetAllAssignmentsController);
router.get("/get-assignment/:id", auth, GetSingleAssignmentController);
router.put("/reassign-request", auth, ReassignCounsellingController);

module.exports = router;