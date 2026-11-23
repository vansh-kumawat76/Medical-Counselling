
const { redisClient } = require("../config/redis");

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (!redisClient.isReady) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log("Redis Cache HIT:", cacheKey);
        return res.status(200).json(JSON.parse(cachedData));
      }

      console.log("Redis Cache MISS:", cacheKey);
    } catch (error) {
      console.error("Redis Cache Read Error:", error.message);
      return next();
    }

    const originalSend = res.send.bind(res);

    res.send = (data) => {
      if (res.statusCode === 200 && redisClient.isReady) {
        try {
          redisClient
            .setEx(cacheKey, duration, JSON.stringify(data))
            .catch((error) => {
              console.error("Redis Cache Write Error:", error.message);
            });
        } catch (error) {
          console.error("Redis Cache Serialization Error:", error.message);
        }
      }

      return originalSend(data);
    };

    next();
  };
};

module.exports = cacheMiddleware;
