
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Pehle Authorization header se token check hoga
    const authHeader = req.headers.authorization;

    // Agar header mein token nahi hai, toh cookie check hogi
    const token =
      (authHeader && authHeader.split(" ")[1]) ||
      req.cookies?.token;

      console.log("Token received:",token)

    if (!token) {
      return res.status(401).send({
        status: false,
        message: "Authorization token is required",
      });
    }

    const decode = jwt.verify(token, "gpTech");

    req.user = decode;

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
