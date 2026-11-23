
const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

redisClient.on("ready", () => {
  console.log("Redis Connected Successfully!");
});

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log("REDIS_URL missing. Redis disabled.");
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis connection failed:", error.message);
  }
};

module.exports = { redisClient, connectRedis };
