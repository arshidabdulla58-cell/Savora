import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.js";
const router = Router();
// Create a category
router.post("/", authenticate, async (req, res) => {
    try {
        const { name, icon, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required",
            });
        }
        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                icon: icon || null,
                color: color || null,
            },
        });
        res.status(201).json({
            message: "Category created successfully!",
            category,
        });
    }
    catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({
            message: "Something went wrong while creating the category",
        });
    }
});
// Get all categories
router.get("/", authenticate, async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: "asc",
            },
        });
        res.json({
            categories,
        });
    }
    catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({
            message: "Something went wrong while fetching categories",
        });
    }
});
// Update a category
router.put("/:id", authenticate, async (req, res) => {
    try {
        const id = String(req.params.id);
        const { name, icon, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required",
            });
        }
        const existingCategory = await prisma.category.findUnique({
            where: {
                id,
            },
        });
        if (!existingCategory) {
            return res.status(404).json({
                message: "Category not found",
            });
        }
        const category = await prisma.category.update({
            where: {
                id,
            },
            data: {
                name: name.trim(),
                icon: icon || null,
                color: color || null,
            },
        });
        res.json({
            message: "Category updated successfully!",
            category,
        });
    }
    catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({
            message: "Something went wrong while updating the category",
        });
    }
});
// Delete a category
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const id = String(req.params.id);
        const existingCategory = await prisma.category.findUnique({
            where: {
                id,
            },
        });
        if (!existingCategory) {
            return res.status(404).json({
                message: "Category not found",
            });
        }
        const transactionCount = await prisma.transaction.count({
            where: {
                categoryId: id,
            },
        });
        if (transactionCount > 0) {
            return res.status(400).json({
                message: "This category cannot be deleted because it is being used by transactions.",
            });
        }
        await prisma.category.delete({
            where: {
                id,
            },
        });
        res.json({
            message: "Category deleted successfully!",
        });
    }
    catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({
            message: "Something went wrong while deleting the category",
        });
    }
});
export default router;
