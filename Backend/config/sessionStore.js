
const { redisClient } = require("./redis");

const getSessionKey = (userId, sessionId) => {
  return `session:${userId}:${sessionId}`;
};

// Store session in Redis
const storeSessionInRedis = async (session) => {
  if (!redisClient.isReady) return;

  try {
    const ttl = Math.ceil(
      (new Date(session.expiresAt).getTime() - Date.now()) / 1000
    );

    if (ttl <= 0) return;

    const sessionData =
      typeof session.toObject === "function"
        ? session.toObject()
        : session;

    const key = getSessionKey(
      sessionData.userId,
      sessionData.sessionId
    );

    await redisClient.setEx(
      key,
      ttl,
      JSON.stringify(sessionData)
    );
  } catch (error) {
    console.error("Redis Session Store Error:", error.message);
  }
};

// Get session from Redis
const getSessionFromRedis = async (userId, sessionId) => {
  if (!redisClient.isReady) return null;

  try {
    const key = getSessionKey(userId, sessionId);
    const session = await redisClient.get(key);

    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error("Redis Session Read Error:", error.message);
    return null;
  }
};

// Delete one session from Redis
const deleteSessionFromRedis = async (userId, sessionId) => {
  if (!redisClient.isReady) return;

  try {
    await redisClient.del(getSessionKey(userId, sessionId));
  } catch (error) {
    console.error("Redis Session Delete Error:", error.message);
  }
};

// Delete all sessions of a user, optionally keeping one session
const deleteUserSessionsFromRedis = async (
  userId,
  exceptSessionId = null
) => {
  if (!redisClient.isReady) return;

  try {
    const pattern = `session:${userId}:*`;

    for await (const key of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      if (
        exceptSessionId &&
        key.endsWith(`:${exceptSessionId}`)
      ) {
        continue;
      }

      await redisClient.del(key);
    }
  } catch (error) {
    console.error("Redis User Sessions Delete Error:", error.message);
  }
};

module.exports = {
  storeSessionInRedis,
  getSessionFromRedis,
  deleteSessionFromRedis,
  deleteUserSessionsFromRedis,
};
