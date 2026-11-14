
const State = require("../models/State");

const createState = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: "State name is required",
      });
    }

    const existingState = await State.findOne({
      name: name.trim(),
    });

    if (existingState) {
      return res.status(400).json({
        status: false,
        message: "State already exists",
      });
    }

    const state = await State.create({
      name: name.trim(),
    });

    return res.status(201).json({
      status: true,
      message: "State created successfully",
      data: state,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
const getAllStates = async (req, res) => {
  try {
    const states = await State.find().sort({ name: 1 });

    return res.status(200).json({
      status: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
module.exports = { createState, getAllStates };
