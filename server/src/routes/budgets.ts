import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Create a budget
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, month, year, categoryId } = req.body;

    // 1. Validate required fields
    if (!amount || !month || !year || !categoryId) {
      return res.status(400).json({
        message:
          "Amount, month, year and categoryId are required",
      });
    }

    // 2. Validate amount
    const budgetAmount = Number(amount);

    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json({
        message: "Budget amount must be greater than 0",
      });
    }

    // 3. Validate month
    const budgetMonth = Number(month);

    if (
      !Number.isInteger(budgetMonth) ||
      budgetMonth < 1 ||
      budgetMonth > 12
    ) {
      return res.status(400).json({
        message: "Month must be between 1 and 12",
      });
    }

    // 4. Validate year
    const budgetYear = Number(year);

    if (
      !Number.isInteger(budgetYear) ||
      budgetYear < 2000
    ) {
      return res.status(400).json({
        message: "Invalid year",
      });
    }

    // 5. Make sure category exists
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // 6. Check if budget already exists
    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId: req.userId!,
          categoryId,
          month: budgetMonth,
          year: budgetYear,
        },
      },
    });

    if (existingBudget) {
      return res.status(409).json({
        message:
          "A budget already exists for this category and month",
      });
    }

    // 7. Create budget
    const budget = await prisma.budget.create({
      data: {
        amount: budgetAmount,
        month: budgetMonth,
        year: budgetYear,
        userId: req.userId!,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      message: "Budget created successfully!",
      budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);

    res.status(500).json({
      message:
        "Something went wrong while creating the budget",
    });
  }
});

// Get all budgets
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId!,
      },
      include: {
        category: true,
      },
      orderBy: [
        {
          year: "desc",
        },
        {
          month: "desc",
        },
      ],
    });

    res.json({
      budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    res.status(500).json({
      message:
        "Something went wrong while fetching budgets",
    });
  }
});

// Update a budget
router.put(
  "/:id",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      // Fix: Express params can be typed as string | string[]
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const { amount, month, year, categoryId } = req.body;

      // 1. Validate required fields
      if (!amount || !month || !year || !categoryId) {
        return res.status(400).json({
          message:
            "Amount, month, year and categoryId are required",
        });
      }

      const budgetAmount = Number(amount);
      const budgetMonth = Number(month);
      const budgetYear = Number(year);

      // 2. Validate amount
      if (
        !Number.isFinite(budgetAmount) ||
        budgetAmount <= 0
      ) {
        return res.status(400).json({
          message: "Budget amount must be greater than 0",
        });
      }

      // 3. Validate month
      if (
        !Number.isInteger(budgetMonth) ||
        budgetMonth < 1 ||
        budgetMonth > 12
      ) {
        return res.status(400).json({
          message: "Month must be between 1 and 12",
        });
      }

      // 4. Validate year
      if (
        !Number.isInteger(budgetYear) ||
        budgetYear < 2000
      ) {
        return res.status(400).json({
          message: "Invalid year",
        });
      }

      // 5. Make sure budget belongs to user
      const existingBudget = await prisma.budget.findFirst({
        where: {
          id,
          userId: req.userId!,
        },
      });

      if (!existingBudget) {
        return res.status(404).json({
          message: "Budget not found",
        });
      }

      // 6. Make sure category exists
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      // 7. Check for duplicate budget
      const duplicateBudget =
        await prisma.budget.findUnique({
          where: {
            userId_categoryId_month_year: {
              userId: req.userId!,
              categoryId,
              month: budgetMonth,
              year: budgetYear,
            },
          },
        });

      if (
        duplicateBudget &&
        duplicateBudget.id !== id
      ) {
        return res.status(409).json({
          message:
            "A budget already exists for this category and month",
        });
      }

      // 8. Update budget
      const budget = await prisma.budget.update({
        where: {
          id,
        },
        data: {
          amount: budgetAmount,
          month: budgetMonth,
          year: budgetYear,
          categoryId,
        },
        include: {
          category: true,
        },
      });

      res.json({
        message: "Budget updated successfully!",
        budget,
      });
    } catch (error) {
      console.error("Update budget error:", error);

      res.status(500).json({
        message:
          "Something went wrong while updating the budget",
      });
    }
  }
);

// Delete a budget
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      // Fix: Express params can be typed as string | string[]
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      // Make sure budget belongs to user
      const existingBudget = await prisma.budget.findFirst({
        where: {
          id,
          userId: req.userId!,
        },
      });

      if (!existingBudget) {
        return res.status(404).json({
          message: "Budget not found",
        });
      }

      await prisma.budget.delete({
        where: {
          id,
        },
      });

      res.json({
        message: "Budget deleted successfully!",
      });
    } catch (error) {
      console.error("Delete budget error:", error);

      res.status(500).json({
        message:
          "Something went wrong while deleting the budget",
      });
    }
  }
);

export default router;