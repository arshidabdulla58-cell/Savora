import jwt from "jsonwebtoken";
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }
        const decoded = jwt.verify(token, secret);
        if (typeof decoded === "string" || !decoded.userId) {
            return res.status(401).json({
                message: "Invalid authentication token",
            });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};
