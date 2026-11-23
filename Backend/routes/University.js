const express = require("express");
const router = express.Router();

const auth = require("../auth");
const checkPermission = require("../middleware/permission");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const {
    createUniversity,
    GetUniversity,
    updateUniversity,
    deleteUniversity
} = require("../controllers/UniversityController");
const upload = require("../middleware/upload");
const BulkUniversityImportController = require("../controllers/BulkUniversity");
router.post(
    "/university",
    auth,
    checkPermission("university.create"),
    upload.fields([{name : "logo", maxCount : 1}]),
    createUniversity
);

router.post(
    "/Bulk-Import-Universities",
    auth,
    checkPermission("university.create"),
    BulkUniversityImportController
);

router.get(
    "/get-university",
    auth,
    checkPermission("university.view"),
    cacheMiddleware(300),
    GetUniversity
);

router.put(
    "/university/:id",
    auth,
    checkPermission("university.update"),
    upload.fields([{name : "logo", maxCount : 1}]),
    updateUniversity
);

router.delete(
    "/university/:id",
    auth,
    checkPermission("university.delete"),
    deleteUniversity
);

module.exports = router;
