import jwt from "jsonwebtoken";
import "dotenv/config";
import { AppError } from "./errorHandler.middleware.js";

export class authMiddleware {

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

            // Chỉ verify token, KHÔNG truy vấn DB
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!decoded) throw new AppError("Invalid token", 400);

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
            console.error("Auth middleware error:", err);

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

            return res.status(500).json({
                status: "error",
                message: "Authentication failed"
            });
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
                    message: "Access denied. Insufficient permissions."
                });
            }

            next();
        };
    }
}

export default new authMiddleware();
