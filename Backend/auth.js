
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
        message: "Authorization token is required",
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
      message: "Invalid or expired token",
    });
  }
};

module.exports = auth;
