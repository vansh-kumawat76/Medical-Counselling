
const express = require("express");
const router = express.Router();
const cacheMiddleware = require("../middleware/cacheMiddleware");
const { createState, getAllStates } = require("../controllers/StateController");

router.post("/create", createState);
router.get("/all", cacheMiddleware(300), getAllStates);
module.exports = router;
