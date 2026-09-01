import { Router } from "express";
import prisma from "../prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

function getBalanceChange(
  amount: number,
  type: "INCOME" | "EXPENSE"
) {
  return type === "INCOME" ? amount : -amount;
}

/*
|--------------------------------------------------------------------------
| Normalize route parameter
|--------------------------------------------------------------------------
*/
function getTransactionId(
  param: string | string[] | undefined
): string | null {
  if (typeof param === "string") {
    return param;
  }

  if (Array.isArray(param) && param.length > 0) {
    return param[0];
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Create transaction
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const {
        amount,
        type,
        description,
        date,
        accountId,
        categoryId,
      } = req.body;

      // Validate amount
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message: "Amount must be greater than 0",
        });
      }

      // Validate required fields
      if (!type || !accountId || !categoryId) {
        return res.status(400).json({
          message:
            "Amount, type, accountId and categoryId are required",
        });
      }

      // Validate transaction type
      if (
        type !== "INCOME" &&
        type !== "EXPENSE"
      ) {
        return res.status(400).json({
          message:
            "Transaction type must be INCOME or EXPENSE",
        });
      }

      // Make sure account belongs to logged-in user
      const account =
        await prisma.account.findFirst({
          where: {
            id: accountId,
            userId: req.userId!,
          },
        });

      if (!account) {
        return res.status(404).json({
          message: "Account not found",
        });
      }

      // Make sure category exists
      const category =
        await prisma.category.findUnique({
          where: {
            id: categoryId,
          },
        });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      // Create transaction and update balance atomically
      const transaction =
        await prisma.$transaction(
          async (tx) => {
            const newTransaction =
              await tx.transaction.create({
                data: {
                  amount: numericAmount,
                  type,
                  description:
                    description || null,
                  date: date
                    ? new Date(date)
                    : new Date(),
                  userId: req.userId!,
                  accountId,
                  categoryId,
                },
              });

            const balanceChange =
              getBalanceChange(
                numericAmount,
                type
              );

            await tx.account.update({
              where: {
                id: accountId,
              },
              data: {
                balance: {
                  increment:
                    balanceChange,
                },
              },
            });

            return newTransaction;
          }
        );

      res.status(201).json({
        message:
          "Transaction created successfully! 🎉",
        transaction,
      });
    } catch (error) {
      console.error(
        "Create transaction error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while creating the transaction",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Get transactions
|--------------------------------------------------------------------------
*/
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const transactions =
        await prisma.transaction.findMany({
          where: {
            userId: req.userId!,
          },
          include: {
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
        });

      res.json({
        transactions,
      });
    } catch (error) {
      console.error(
        "Get transactions error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while fetching transactions",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Update transaction
|--------------------------------------------------------------------------
*/
router.put(
  "/:id",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      // Normalize req.params.id
      const id = getTransactionId(
        req.params.id
      );

      if (!id) {
        return res.status(400).json({
          message: "Transaction ID is required",
        });
      }

      const {
        amount,
        type,
        description,
        date,
        accountId,
        categoryId,
      } = req.body;

      // Validate amount
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message: "Amount must be greater than 0",
        });
      }

      // Validate required fields
      if (!type || !accountId || !categoryId) {
        return res.status(400).json({
          message:
            "Amount, type, accountId and categoryId are required",
        });
      }

      // Validate transaction type
      if (
        type !== "INCOME" &&
        type !== "EXPENSE"
      ) {
        return res.status(400).json({
          message:
            "Transaction type must be INCOME or EXPENSE",
        });
      }

      // Find existing transaction belonging to user
      const existingTransaction =
        await prisma.transaction.findFirst({
          where: {
            id: id,
            userId: req.userId!,
          },
        });

      if (!existingTransaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }

      // Make sure new account belongs to user
      const account =
        await prisma.account.findFirst({
          where: {
            id: accountId,
            userId: req.userId!,
          },
        });

      if (!account) {
        return res.status(404).json({
          message: "Account not found",
        });
      }

      // Make sure category exists
      const category =
        await prisma.category.findUnique({
          where: {
            id: categoryId,
          },
        });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      /*
       * Update transaction and account balances
       * inside one database transaction.
       */
      const updatedTransaction =
        await prisma.$transaction(
          async (tx) => {
            /*
             * 1. Reverse old transaction
             */
            const oldAmount = Number(
              existingTransaction.amount
            );

            const oldBalanceChange =
              getBalanceChange(
                oldAmount,
                existingTransaction.type
              );

            await tx.account.update({
              where: {
                id: existingTransaction.accountId,
              },
              data: {
                balance: {
                  increment:
                    -oldBalanceChange,
                },
              },
            });

            /*
             * 2. Apply new transaction
             */
            const newBalanceChange =
              getBalanceChange(
                numericAmount,
                type
              );

            await tx.account.update({
              where: {
                id: accountId,
              },
              data: {
                balance: {
                  increment:
                    newBalanceChange,
                },
              },
            });

            /*
             * 3. Update transaction
             */
            const updated =
              await tx.transaction.update({
                where: {
                  id: id,
                },
                data: {
                  amount: numericAmount,
                  type,
                  description:
                    description || null,
                  date: date
                    ? new Date(date)
                    : existingTransaction.date,
                  accountId,
                  categoryId,
                },
              });

            return updated;
          }
        );

      res.json({
        message:
          "Transaction updated successfully! 🎉",
        transaction: updatedTransaction,
      });
    } catch (error) {
      console.error(
        "Update transaction error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while updating the transaction",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Delete transaction
|--------------------------------------------------------------------------
*/
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      // Normalize req.params.id
      const id = getTransactionId(
        req.params.id
      );

      if (!id) {
        return res.status(400).json({
          message: "Transaction ID is required",
        });
      }

      // Find transaction belonging to user
      const existingTransaction =
        await prisma.transaction.findFirst({
          where: {
            id: id,
            userId: req.userId!,
          },
        });

      if (!existingTransaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }

      /*
       * Reverse transaction effect on account
       * and delete transaction atomically.
       */
      await prisma.$transaction(
        async (tx) => {
          const amount = Number(
            existingTransaction.amount
          );

          const balanceChange =
            getBalanceChange(
              amount,
              existingTransaction.type
            );

          // Reverse old balance change
          await tx.account.update({
            where: {
              id: existingTransaction.accountId,
            },
            data: {
              balance: {
                increment:
                  -balanceChange,
              },
            },
          });

          // Delete transaction
          await tx.transaction.delete({
            where: {
              id: id,
            },
          });
        }
      );

      res.json({
        message:
          "Transaction deleted successfully!",
      });
    } catch (error) {
      console.error(
        "Delete transaction error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while deleting the transaction",
      });
    }
  }
);

export default router;