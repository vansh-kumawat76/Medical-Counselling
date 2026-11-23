
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing from environment variables.");
}

// Separate Redis connection for BullMQ
const queueConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
});

queueConnection.on("error", (error) => {
  console.error("BullMQ Redis Connection Error:", error.message);
});

queueConnection.on("ready", () => {
  console.log("BullMQ Redis Connected Successfully!");
});

// Main application queue
const jobQueue = new Queue("liveproject-jobs", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

jobQueue.on("error", (error) => {
  console.error("BullMQ Queue Error:", error.message);
});

module.exports = {
  jobQueue,
  queueConnection,
};
