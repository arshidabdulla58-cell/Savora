import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/accounts.js";
import transactionRoutes from "./routes/transactions.js";
import categoryRoutes from "./routes/categories.js";
import dashboardRoutes from "./routes/dashboard.js";
import budgetRoutes from "./routes/budgets.js";
import goalsRouter from "./routes/goals.js";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 5000;
// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalsRouter);
// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Savora API 🚀",
    });
});
app.get("/api/test-db", async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        res.json({
            message: "Savora database connected successfully! 🚀",
            users: userCount,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed",
        });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Savora server running on http://localhost:${PORT}`);
});
