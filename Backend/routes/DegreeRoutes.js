const express = require('express');
const router = express.Router();
const auth = require("../auth");
const { degreeCreateController, GetAllDegreeController, EditDegreeController, DeleteDegreeController, GetDegreeByIdController, SearchDegreeController, FilterDegreeController, SortDegreeController, PaginationDegreeController } = require('../controllers/DegreeController');
const BulkDegreeImportController = require('../controllers/BulkDegreeImport');


router.post("/Add-New-degree",auth, degreeCreateController);
router.get("/GetAllDegree",auth, GetAllDegreeController);
router.put("/Edit-Degree/:id",auth, EditDegreeController);
router.delete("/Delete-Degree/:id",auth, DeleteDegreeController);
router.get("/Get-Degree-By-Id/:id",auth, GetDegreeByIdController);
router.get("/Search-Degree",auth, SearchDegreeController);
router.get("/Filter-Degrees",auth, FilterDegreeController);
router.get("/Sort-Degrees",auth, SortDegreeController);
router.get("/Pagination-Degrees",auth, PaginationDegreeController);
router.post("/Bulk-Import-Degrees", BulkDegreeImportController);
module.exports = router