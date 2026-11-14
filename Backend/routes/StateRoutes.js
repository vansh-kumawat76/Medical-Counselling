
const express = require("express");
const router = express.Router();

const { createState, getAllStates } = require("../controllers/StateController");

router.post("/create", createState);
router.get("/all", getAllStates);
module.exports = router;
