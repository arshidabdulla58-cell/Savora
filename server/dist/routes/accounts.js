import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.js";
const router = Router();
router.post("/", authenticate, async (req, res) => {
    try {
        const { name, type, balance } = req.body;
        // Check required fields
        if (!name || !type) {
            return res.status(400).json({
                message: "Account name and type are required",
            });
        }
        // Validate account type
        const validTypes = [
            "CASH",
            "BANK",
            "CREDIT_CARD",
            "SAVINGS",
            "INVESTMENT",
        ];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid account type",
            });
        }
        // Create account
        const account = await prisma.account.create({
            data: {
                name,
                type,
                balance: balance ?? 0,
                userId: req.userId,
            },
        });
        res.status(201).json({
            message: "Account created successfully! 🎉",
            account,
        });
    }
    catch (error) {
        console.error("Create account error:", error);
        res.status(500).json({
            message: "Something went wrong while creating the account",
        });
    }
});
router.get("/", authenticate, async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: {
                userId: req.userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json({
            accounts,
        });
    }
    catch (error) {
        console.error("Get accounts error:", error);
        res.status(500).json({
            message: "Something went wrong while fetching accounts",
        });
    }
});
export default router;
