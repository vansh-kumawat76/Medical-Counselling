
const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  createPlan,
  getAllPlans,
  getActivePlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
} = require("../controllers/CounsellingPlanController");

// ADMIN / SUPERADMIN ACCESS
const adminOnly = (req, res, next) => {
  const role = req.user?.role;

  if (role !== "Admin" && role !== "SuperAdmin") {
    return res.status(403).json({
      success: false,
      message: "Only Admin or SuperAdmin can manage counselling plans",
    });
  }

  next();
};

// PUBLIC ROUTE
router.get("/active", getActivePlans);

// ADMIN ROUTES
router.get("/", auth, adminOnly, getAllPlans);
router.post("/", auth, adminOnly, createPlan);
router.get("/:planId", auth, adminOnly, getSinglePlan);
router.put("/:planId", auth, adminOnly, updatePlan);
router.delete("/:planId", auth, adminOnly, deletePlan);

module.exports = router;
