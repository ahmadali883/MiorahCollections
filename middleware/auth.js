const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Simple in-memory token blacklist (shared between auth routes and middleware)
const tokenBlacklist = new Set();

const verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if not token (check if the token doesn't exist)
  if (!token) {
    // 401 unauthorized access
    return res.status(401).json({ msg: "No Token, authorization denied!" });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ msg: "Token has been invalidated, please login again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET);

    // Once verified, the payload will be put into decoded
    // We take the user out by taking the user id from the payload
    req.user = decoded.user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('jwt expired');
      return res.status(401).json({ msg: "Token expired, please login again" });
    } else if (error.name === 'JsonWebTokenError') {
      console.log('jwt malformed');
      return res.status(401).json({ msg: "Invalid token" });
    } else {
      console.error(error.message);
      return res.status(401).json({ msg: "Token is not valid" });
    }
  }
};

const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).send("You're not allowed to do that!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).send("You're not allowed to do that!");
    }
  });
};

// TO CHECK IF THE USER IS THE ONE MAKING THE REQUEST
const verifyTokenAndUser= (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.body.user || req.user.isAdmin) {
      next();
    } else {
      res.status(403).send("You're not allowed to do that!");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyTokenAndUser,
  tokenBlacklist,
};
