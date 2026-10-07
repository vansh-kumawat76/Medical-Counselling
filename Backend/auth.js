const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send({
        status: false,
        message: "Authorization token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).send({
        status: false,
        message: "Token is missing",
      });
    }

    console.log("token >>>", token);

    const decode = jwt.verify(token, "gpTech");

    console.log("decode >>>", decode);

    req.user = decode;

    next();
  } catch (error) {
    console.log("JWT Error >>>", error.message);

    return res.status(401).send({
      status: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = auth;