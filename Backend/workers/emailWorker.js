require("dotenv").config();
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const transport = require("../config/mailer");

const workerConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

workerConnection.on("error", (error) => {
  console.error("Email Worker Redis Error:", error.message);
});

const emailWorker = new Worker(
  "liveproject-jobs",
  async (job) => {
    if (job.name === "send-email") {
      const { to, subject, text, html } = job.data;

      await transport.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
      });

      console.log("Background Email Sent:", to);
    }
  },
  {
    connection: workerConnection,
    concurrency: 5,
  }
);

emailWorker.on("ready", () => {
  console.log("Email Worker Ready!");
});

emailWorker.on("completed", (job) => {
  console.log("Email Job Completed:", job.id);
});

emailWorker.on("failed", async (job, error) => {
  console.error("Email Job Failed:", job?.id, error.message);

  const maxAttempts = job?.opts?.attempts || 1;

  if (
    job &&
    job.attemptsMade >= maxAttempts &&
    job.data?.otpKey
  ) {
    try {
      await workerConnection.del(job.data.otpKey);

      console.log(
        "OTP Deleted After Final Email Failure:",
        job.data.otpKey
      );
    } catch (redisError) {
      console.error(
        "OTP Cleanup Error:",
        redisError.message
      );
    }
  }
});

module.exports = emailWorker;
