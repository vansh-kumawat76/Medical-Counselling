
const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  AddSpecializationController,
  GetAllSpecializationsController,
  GetSpecializationByIdController,
  EditSpecializationController,
  DeleteSpecializationController,
  SearchSpecializationController,
  FilterSpecializationController,
  SortSpecializationController,
  PaginationSpecializationController,
} = require("../controllers/SpecializationController");

router.post(
  "/Add-New-Specialization",
  auth,
  AddSpecializationController
);

router.get(
  "/Get-All-Specializations",
  auth,
  GetAllSpecializationsController
);

router.get(
  "/Get-Specialization-By-Id/:id",
  auth,
  GetSpecializationByIdController
);

router.put(
  "/Edit-Specialization/:id",
  auth,
  EditSpecializationController
);

router.delete(
  "/Delete-Specialization/:id",
  auth,
  DeleteSpecializationController
);

router.get(
  "/Search-Specializations",
  auth,
  SearchSpecializationController
);

router.get(
  "/Filter-Specializations",
  auth,
  FilterSpecializationController
);

router.get(
  "/Sort-Specializations",
  auth,
  SortSpecializationController
);

router.get(
  "/Pagination-Specializations",
  auth,
  PaginationSpecializationController
);

module.exports = router;
