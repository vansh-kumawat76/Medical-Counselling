
const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  CreateFollowUp,
  GetAllFollowUps,
  GetSingleFollowUp,
  UpdateFollowUp,
  DeleteFollowUp,
} = require("../controllers/FollowUpController");

// Create Follow-Up
router.post("/Create-FollowUp", auth, CreateFollowUp);

// Get All Follow-Ups
router.get("/Get-All-FollowUps", auth, GetAllFollowUps);

// Get Single Follow-Up
router.get("/Get-Single-FollowUp/:id", auth, GetSingleFollowUp);

// Update Follow-Up
router.put("/Update-FollowUp/:id", auth, UpdateFollowUp);

// Delete Follow-Up
router.delete("/Delete-FollowUp/:id", auth, DeleteFollowUp);

module.exports = router;
