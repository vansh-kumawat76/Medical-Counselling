
const CounsellingPlan = require("../models/CounsellingPlan.js");

// CREATE PLAN
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      features,
      isPopular,
      isActive,
      displayOrder,
    } = req.body;

    if (!name || price === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, price and description are required",
      });
    }

    if (Number(price) < 0 || !Number.isFinite(Number(price))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid price",
      });
    }

    const existingPlan = await CounsellingPlan.findOne({
      name: name.trim(),
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: "Plan with this name already exists",
      });
    }

    const plan = await CounsellingPlan.create({
      name: name.trim(),
      price: Number(price),
      description,
      features: Array.isArray(features) ? features : [],
      isPopular: isPopular ?? false,
      isActive: isActive ?? true,
      displayOrder: Number(displayOrder) || 0,
    });

    res.status(201).json({
      success: true,
      message: "Counselling plan created successfully",
      plan,
    });
  } catch (error) {
    console.log("Create Plan Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL PLANS (ADMIN)
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await CounsellingPlan.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.log("Get All Plans Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ACTIVE PLANS (PUBLIC - STUDENT FRONTEND)
exports.getActivePlans = async (req, res) => {
  try {
    const plans = await CounsellingPlan.find({
      isActive: true,
    }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.log("Get Active Plans Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE PLAN
exports.getSinglePlan = async (req, res) => {
  try {
    const plan = await CounsellingPlan.findById(req.params.planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Counselling plan not found",
      });
    }

    res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    console.log("Get Single Plan Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE PLAN
exports.updatePlan = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      features,
      isPopular,
      isActive,
      displayOrder,
    } = req.body;

    if (price !== undefined &&
      (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid price",
      });
    }

    if (name !== undefined) {
      const existingPlan = await CounsellingPlan.findOne({
        name: name.trim(),
        _id: { $ne: req.params.planId },
      });

      if (existingPlan) {
        return res.status(409).json({
          success: false,
          message: "Another plan with this name already exists",
        });
      }
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = features;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) {
      updateData.displayOrder = Number(displayOrder);
    }

    const plan = await CounsellingPlan.findByIdAndUpdate(
      req.params.planId,
      updateData,
     {
  returnDocument: "after",
  runValidators: true,
}
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Counselling plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Counselling plan updated successfully",
      plan,
    });
  } catch (error) {
    console.log("Update Plan Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE PLAN
exports.deletePlan = async (req, res) => {
  try {
    const plan = await CounsellingPlan.findByIdAndDelete(
      req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Counselling plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Counselling plan deleted successfully",
    });
  } catch (error) {
    console.log("Delete Plan Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
