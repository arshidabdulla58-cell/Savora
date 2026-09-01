import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.js";
const router = Router();
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // 1. Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }
        // 2. Check password length
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }
        // 3. Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }
        // 4. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // 5. Create the user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        // 6. Don't send the password back
        res.status(201).json({
            message: "Account created successfully! 🎉",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Something went wrong while creating your account",
        });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // 1. Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }
        // 2. Find the user
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        // 3. Compare passwords
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        // 4. Create JWT
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
        }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        // 5. Send response
        res.json({
            message: "Login successful! 🎉",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Something went wrong while logging in",
        });
    }
});
router.get("/me", authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        res.json({
            user,
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});
export default router;
