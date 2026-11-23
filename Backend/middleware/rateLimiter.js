
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("../config/redis");

// Redis Store factory
const createRedisStore = (prefix) => {
  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });
};

// General API: 100 requests / 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("rl:general:"),
  message: {
    success: false,
    message: "You have made too many requests. Please try again in 15 minutes.",
  },
});

// Login: 5 requests / 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("rl:login:"),
  message: {
    success: false,
    message: "Too many sign-in attempts. Please try again in 15 minutes.",
  },
});


// Forgot Password: 3 requests / 15 minutes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("rl:forgot-password:"),
  message: {
    success: false,
    message: "Too many password recovery requests. Please try again in 15 minutes.",
  },
});

// OTP Verification: 5 requests / 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("rl:otp:"),
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

// Reset Password: 5 requests / 15 minutes
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("rl:reset-password:"),
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again in 15 minutes.",
  },
});

// Change Password: 5 requests / 15 minutes
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("rl:change-password:"),
  message: {
    success: false,
    message: "Too many password change attempts. Please try again in 15 minutes.",
  },
});

module.exports = {
  generalLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  otpLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
};
