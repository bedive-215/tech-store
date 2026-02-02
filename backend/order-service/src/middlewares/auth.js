const jwt = require("jsonwebtoken");
require("dotenv").config();

class AuthMiddleware {
  async auth(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          status: "error",
          message: "Access token required"
        });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Gán payload vào req.user
      req.user = {
        id: decoded.id || decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        full_name: decoded.full_name,
        phone_number: decoded.phone_number
      };

      next();
    } catch (err) {
      console.error("Auth middleware error:", err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "error",
          message: "Access token expired"
        });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(403).json({
          status: "error",
          message: "Invalid token"
        });
      }

      return res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
    }
  }

  // Optional auth - allows both authenticated and guest users
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        // No token = guest user
        req.user = {
          id: null,
          email: null,
          role: "guest",
          full_name: null,
          phone_number: null,
          isGuest: true
        };
        return next();
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      req.user = {
        id: decoded.id || decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        full_name: decoded.full_name,
        phone_number: decoded.phone_number,
        isGuest: false
      };

      next();
    } catch (err) {
      // Invalid token = treat as guest
      console.warn("Optional auth - invalid token, treating as guest:", err.message);
      req.user = {
        id: null,
        email: null,
        role: "guest",
        full_name: null,
        phone_number: null,
        isGuest: true
      };
      next();
    }
  }

  checkRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized"
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: "error",
          message: "Access denied"
        });
      }

      next();
    };
  }
}

module.exports = new AuthMiddleware();
