
const State = require("../models/State");
const { redisClient } = require("../config/redis");

async function clearStateCache() {
  if (!redisClient.isReady) return;

  try {
    const keys = redisClient.scanIterator({
      MATCH: "cache:*/all*",
      COUNT: 100,
    });

    for await (const key of keys) {
      await redisClient.del(key);
    }

    console.log("State Cache Cleared Successfully!");
  } catch (error) {
    console.error("State Cache Clear Error:", error.message);
  }
}

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

    await clearStateCache();

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
