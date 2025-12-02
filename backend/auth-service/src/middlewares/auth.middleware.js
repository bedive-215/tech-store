import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/token.js";
import "dotenv/config";
import models from "../models/index.js";
import { AppError } from "./errorHandler.middleware.js";

export class authMiddleware {
    constructor() {
        this.User = models.User;
    }

    async auth(req, res, next) {
        try {
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];
            
            if (!token) {
                return res.status(401).json({ 
                    status: 'error',
                    message: "Access token required" 
                });
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if(!decoded) throw new AppError('Invalid decode', 400)
            
            const user = await this.User.findByPk(decoded.user_id);
            if (!user) {
                return res.status(404).json({ 
                    status: 'error',
                    message: "User not found" 
                });
            }
            req.user = {
                id: decoded.user_id,
                email: decoded.email,
                role: decoded.role,
                full_name: user.full_name,
                role: user.role,
                phone_number: decoded.phone_number
            };
            
            next();
        } catch (err) {
            console.error("Auth middleware error:", err);
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ 
                    status: 'error',
                    message: "Access token expired" 
                });
            }
            if (err.name === "JsonWebTokenError") {
                return res.status(403).json({ 
                    status: 'error',
                    message: "Invalid token" 
                });
            }
            return res.status(500).json({ 
                status: 'error',
                message: "Authentication failed" 
            });
        }
    }

    // Middleware làm mới Access Token bằng Refresh Token
    async checkAuth(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (!refreshToken) {
                return res.status(401).json({ 
                    status: 'error',
                    message: "Refresh token missing" 
                });
            }

            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            
            const user = await this.User.findOne({ 
                where: { 
                    id: decoded.id,
                    refresh_token: refreshToken 
                } 
            });
            
            if (!user) {
                return res.status(403).json({ 
                    status: 'error',
                    message: "Invalid refresh token" 
                });
            }

            // Kiểm tra refresh token hết hạn chưa
            if (user.refresh_token_expires_at && new Date(user.refresh_token_expires_at) < new Date()) {
                return res.status(401).json({ 
                    status: 'error',
                    message: "Refresh token expired. Please login again." 
                });
            }

            // Tạo access token mới
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                phone_number: user.phone_number
            };
            
            const newAccessToken = generateAccessToken(payload);
            
            req.user = payload;
            req.token = newAccessToken;
            res.locals.newAccessToken = newAccessToken;
            
            return next();
        } catch (err) {
            console.error("checkAuth middleware error:", err.message);
            
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ 
                    status: 'error',
                    message: "Refresh token expired. Please login again." 
                });
            }
            if (err.name === "JsonWebTokenError") {
                return res.status(403).json({ 
                    status: 'error',
                    message: "Invalid refresh token" 
                });
            }
            return res.status(500).json({ 
                status: 'error',
                message: "Token refresh failed" 
            });
        }
    }

    checkRole(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    status: 'error',
                    message: "Unauthorized" 
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ 
                    status: 'error',
                    message: "Access denied. Insufficient permissions." 
                });
            }
            next();
        };
    }
}

// Export instance
const authMiddlewareInstance = new authMiddleware();
export default authMiddlewareInstance;