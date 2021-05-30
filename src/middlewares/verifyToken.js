const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).send("Access Denied");

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    req.user = verified;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send("Invalid Token");
  }
};
