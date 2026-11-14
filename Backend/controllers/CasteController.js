const mongoose = require("mongoose");
const Caste = require("../models/Caste");
const State = require("../models/State");

const createCaste = async (req, res) => {
  try {
    const { name, category, level, state } = req.body;

    if (!name || !category || !level) {
      return res.status(400).json({
        status: false,
        message: "Name, category and level are required",
      });
    }

    if (!["Central", "State"].includes(level)) {
      return res.status(400).json({
        status: false,
        message: "Invalid caste level",
      });
    }

    if (level === "State" && !state) {
      return res.status(400).json({
        status: false,
        message: "State is required for State level caste",
      });
    }

    if (level === "Central" && state) {
      return res.status(400).json({
        status: false,
        message: "State is not required for Central level caste",
      });
    }

    if (state) {
      const stateExists = await State.findById(state);

      if (!stateExists) {
        return res.status(404).json({
          status: false,
          message: "State not found",
        });
      }
    }

    const existingCaste = await Caste.findOne({
      name: name.trim(),
      level,
      state: state || null,
    });

    if (existingCaste) {
      return res.status(409).json({
        status: false,
        message: "Caste already exists",
      });
    }

    const caste = await Caste.create({
      name: name.trim(),
      category,
      level,
      state: state || null,
    });

    return res.status(201).json({
      status: true,
      message: "Caste created successfully",
      data: caste,
    });
  } catch (error) {
    console.log("Create Caste Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const getAllCastes = async (req, res) => {
  try {
    const castes = await Caste.find({status : true})
      .populate("state", "name")
      .sort({ name: 1 });

    return res.status(200).json({
      status: true,
      count: castes.length,
      data: castes,
    });
  } catch (error) {
    console.log("Get All Castes Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const getCastesByLevel = async (req, res) => {
  try {
    const { level } = req.query;

    if (!level || !["Central", "State"].includes(level)) {
      return res.status(400).json({
        status: false,
        message: "Valid level (Central or State) is required",
      });
    }

    const castes = await Caste.find({
      level,
      status : true
    })
      .populate("state", "name")
      .sort({ name: 1 });

    return res.status(200).json({
      status: true,
      count: castes.length,
      data: castes,
    });
  } catch (error) {
    console.log("Get Castes By Level Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const getCastesByState = async (req, res) => {
  try {
    const { stateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(stateId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid State ID",
      });
    }

    const stateExists = await State.findById(stateId);

    if (!stateExists) {
      return res.status(404).json({
        status: false,
        message: "State not found",
      });
    }

    const castes = await Caste.find({
      level: "State",
      state: stateId,
      status : true
    })
      .populate("state", "name")
      .sort({ name: 1 });

    return res.status(200).json({
      status: true,
      count: castes.length,
      data: castes,
    });
  } catch (error) {
    console.log("Get Castes By State Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const updateCaste = async (req, res) => {
  try {
    const { casteId } = req.params;
    const { name, category, level, state } = req.body;

    if (!mongoose.Types.ObjectId.isValid(casteId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Caste ID",
      });
    }

    const caste = await Caste.findById(casteId);

    if (!caste) {
      return res.status(404).json({
        status: false,
        message: "Caste not found",
      });
    }

    const updatedName = name !== undefined ? name.trim() : caste.name;
    const updatedCategory =
      category !== undefined ? category : caste.category;
    const updatedLevel = level !== undefined ? level : caste.level;

    let updatedState =
      state !== undefined ? state : caste.state;

    if (!updatedName) {
      return res.status(400).json({
        status: false,
        message: "Caste name is required",
      });
    }

    if (!["Central", "State"].includes(updatedLevel)) {
      return res.status(400).json({
        status: false,
        message: "Invalid caste level",
      });
    }

    if (updatedLevel === "Central") {
      updatedState = null;
    }

    if (updatedLevel === "State" && !updatedState) {
      return res.status(400).json({
        status: false,
        message: "State is required for State level caste",
      });
    }

    if (updatedState) {
      if (!mongoose.Types.ObjectId.isValid(updatedState)) {
        return res.status(400).json({
          status: false,
          message: "Invalid State ID",
        });
      }

      const stateExists = await State.findById(updatedState);

      if (!stateExists) {
        return res.status(404).json({
          status: false,
          message: "State not found",
        });
      }
    }

    const existingCaste = await Caste.findOne({
      _id: { $ne: casteId },
      name: updatedName,
      level: updatedLevel,
      state: updatedState || null,
    });

    if (existingCaste) {
      return res.status(409).json({
        status: false,
        message: "Caste already exists",
      });
    }

    caste.name = updatedName;
    caste.category = updatedCategory;
    caste.level = updatedLevel;
    caste.state = updatedState;

    await caste.save();

    return res.status(200).json({
      status: true,
      message: "Caste updated successfully",
      data: caste,
    });
  } catch (error) {
    console.log("Update Caste Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Caste already exists",
      });
    }

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const deleteCaste = async (req, res) => {
  try {
    const { casteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(casteId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Caste ID",
      });
    }

    const caste = await Caste.findById(casteId);

    if (!caste) {
      return res.status(404).json({
        status: false,
        message: "Caste not found",
      });
    }

    if (!caste.status) {
      return res.status(400).json({
        status: false,
        message: "Caste is already inactive",
      });
    }

    caste.status = false;

    await caste.save();

    return res.status(200).json({
      status: true,
      message: "Caste deactivated successfully",
      data: caste,
    });
  } catch (error) {
    console.log("Delete Caste Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


module.exports = { createCaste, getAllCastes, getCastesByLevel, getCastesByState, updateCaste, deleteCaste};
