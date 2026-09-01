import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.js";
const router = Router();
router.get("/", authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const [accounts, transactions] = await Promise.all([
            prisma.account.findMany({
                where: {
                    userId,
                },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    balance: true,
                },
                orderBy: {
                    name: "asc",
                },
            }),
            prisma.transaction.findMany({
                where: {
                    userId,
                },
                select: {
                    id: true,
                    amount: true,
                    type: true,
                    description: true,
                    date: true,
                    account: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            icon: true,
                            color: true,
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            }),
        ]);
        // Total balance
        const totalBalance = accounts.reduce((total, account) => total + Number(account.balance), 0);
        // Total income
        const totalIncome = transactions
            .filter((transaction) => transaction.type === "INCOME")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);
        // Total expenses
        const totalExpenses = transactions
            .filter((transaction) => transaction.type === "EXPENSE")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);
        // Savings
        const savings = totalIncome - totalExpenses;
        // Savings rate
        const savingsRate = totalIncome > 0
            ? Number(((savings / totalIncome) * 100).toFixed(2))
            : 0;
        // -----------------------------
        // Monthly income / expenses
        // -----------------------------
        const monthlyMap = {};
        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = {
                    income: 0,
                    expenses: 0,
                };
            }
            if (transaction.type === "INCOME") {
                monthlyMap[key].income += Number(transaction.amount);
            }
            else {
                monthlyMap[key].expenses += Number(transaction.amount);
            }
        });
        const monthlyData = Object.entries(monthlyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, values]) => ({
            month,
            income: values.income,
            expenses: values.expenses,
        }));
        // -----------------------------
        // Spending by category
        // -----------------------------
        const categoryMap = {};
        transactions
            .filter((transaction) => transaction.type === "EXPENSE")
            .forEach((transaction) => {
            const categoryId = transaction.category.id;
            if (!categoryMap[categoryId]) {
                categoryMap[categoryId] = {
                    name: transaction.category.name,
                    icon: transaction.category.icon,
                    color: transaction.category.color,
                    amount: 0,
                };
            }
            categoryMap[categoryId].amount += Number(transaction.amount);
        });
        const categoryData = Object.values(categoryMap)
            .sort((a, b) => b.amount - a.amount);
        // -----------------------------
        // Recent transactions
        // -----------------------------
        const recentTransactions = transactions
            .slice(0, 6)
            .map((transaction) => ({
            id: transaction.id,
            amount: Number(transaction.amount),
            type: transaction.type,
            description: transaction.description,
            date: transaction.date,
            account: transaction.account,
            category: transaction.category,
        }));
        // -----------------------------
        // Response
        // -----------------------------
        res.json({
            totalBalance,
            totalIncome,
            totalExpenses,
            savings,
            savingsRate,
            accounts,
            monthlyData,
            categoryData,
            recentTransactions,
        });
    }
    catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            message: "Something went wrong while loading the dashboard",
        });
    }
});
export default router;
