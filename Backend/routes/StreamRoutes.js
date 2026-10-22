
const express = require("express");
const auth = require("../auth");
const {
  StreamController,
  GetStreamController,
  EditStreamHandler,
  DeleteStreamHandler,
  SearchStreamController,
} = require("../controllers/StreamController");
const BulkStreamImportController = require("../controllers/BulkStreamImportController");

const router = express.Router();

router.post("/Add-New-Stream",auth, StreamController);
router.get("/Get-All-Streams",auth, GetStreamController);
router.get("/Search-Streams",auth, SearchStreamController);
router.put("/Edit-Stream",auth, EditStreamHandler);
router.delete("/Delete-Stream",auth, DeleteStreamHandler);
router.post(
  "/Bulk-Import-Streams",
  BulkStreamImportController
);
module.exports = router;
