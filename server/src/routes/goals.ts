import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

/*
  Create a goal
*/
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      target,
      current,
      deadline,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Goal name is required",
      });
    }

    if (
      target === undefined ||
      target === null ||
      Number(target) <= 0 ||
      Number.isNaN(Number(target))
    ) {
      return res.status(400).json({
        message: "Target amount must be greater than 0",
      });
    }

    if (
      current !== undefined &&
      current !== null &&
      (Number(current) < 0 || Number.isNaN(Number(current)))
    ) {
      return res.status(400).json({
        message: "Current amount cannot be negative",
      });
    }

    const validStatuses = [
      "ACTIVE",
      "COMPLETED",
      "PAUSED",
    ];

    if (
      status !== undefined &&
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid goal status",
      });
    }

    const goal = await prisma.goal.create({
      data: {
        name: name.trim(),
        target: Number(target),
        current:
          current !== undefined && current !== null
            ? Number(current)
            : 0,
        deadline: deadline
          ? new Date(deadline)
          : null,
        status: status || "ACTIVE",
        userId: req.userId!,
      },
    });

    res.status(201).json({
      message: "Goal created successfully!",
      goal,
    });
  } catch (error) {
    console.error("Create goal error:", error);

    res.status(500).json({
      message: "Something went wrong while creating the goal",
    });
  }
});


/*
  Get all goals
*/
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: req.userId!,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      goals,
    });
  } catch (error) {
    console.error("Get goals error:", error);

    res.status(500).json({
      message: "Something went wrong while fetching goals",
    });
  }
});


/*
  Update a goal
*/
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);

    const {
      name,
      target,
      current,
      deadline,
      status,
    } = req.body;

    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Goal name is required",
      });
    }

    if (
      target !== undefined &&
      (
        Number(target) <= 0 ||
        Number.isNaN(Number(target))
      )
    ) {
      return res.status(400).json({
        message: "Target amount must be greater than 0",
      });
    }

    if (
      current !== undefined &&
      (
        Number(current) < 0 ||
        Number.isNaN(Number(current))
      )
    ) {
      return res.status(400).json({
        message: "Current amount cannot be negative",
      });
    }

    const validStatuses = [
      "ACTIVE",
      "COMPLETED",
      "PAUSED",
    ];

    if (
      status !== undefined &&
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid goal status",
      });
    }

    const goal = await prisma.goal.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(target !== undefined && {
          target: Number(target),
        }),

        ...(current !== undefined && {
          current: Number(current),
        }),

        ...(deadline !== undefined && {
          deadline: deadline
            ? new Date(deadline)
            : null,
        }),

        ...(status !== undefined && {
          status,
        }),
      },
    });

    res.json({
      message: "Goal updated successfully!",
      goal,
    });
  } catch (error) {
    console.error("Update goal error:", error);

    res.status(500).json({
      message: "Something went wrong while updating the goal",
    });
  }
});


/*
  Delete a goal
*/
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id);

      const existingGoal = await prisma.goal.findFirst({
        where: {
          id,
          userId: req.userId!,
        },
      });

      if (!existingGoal) {
        return res.status(404).json({
          message: "Goal not found",
        });
      }

      await prisma.goal.delete({
        where: {
          id,
        },
      });

      res.json({
        message: "Goal deleted successfully!",
      });
    } catch (error) {
      console.error("Delete goal error:", error);

      res.status(500).json({
        message: "Something went wrong while deleting the goal",
      });
    }
  }
);

export default router;