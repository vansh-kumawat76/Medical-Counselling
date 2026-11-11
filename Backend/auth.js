
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token =
      (authHeader && authHeader.split(" ")[1]) ||
      req.cookies?.token;

    console.log("Token received:", token ? "Present" : "Missing");

    if (!token) {
      return res.status(401).send({
        status: false,
        message: "Authentication token is required to access this resource.",
      });
    }

    const decode = jwt.verify(token, "gpTech");

    console.log("AUTH MIDDLEWARE HIT");
    console.log("JWT PAYLOAD:", decode);

    req.user = decode;

    console.log("Decoded JWT Payload:", decode);
    console.log("Decoded JWT Payload:", JSON.stringify(req.user, null, 2));

    next();
  } catch (error) {
    console.log("JWT Error:", error.message);

    return res.status(401).send({
      status: false,
      message: "The authentication token is invalid or has expired. Please log in again.",
    });
  }
};

module.exports = auth;
