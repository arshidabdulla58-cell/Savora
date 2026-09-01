import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  WalletCards,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

interface Budget {
  id: string;
  amount: number | string;
  month: number;
  year: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Transaction {
  id: string;
  amount: number | string;
  type: "INCOME" | "EXPENSE";
  date: string;
  categoryId: string;
}

function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(
    null
  );

  const currentDate = new Date();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [month, setMonth] = useState(
    String(currentDate.getMonth() + 1)
  );
  const [year, setYear] = useState(
    String(currentDate.getFullYear())
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem("savora_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    try {
      setError("");

      const [budgetsResponse, categoriesResponse, transactionsResponse] =
        await Promise.all([
          api.get("/budgets", {
            headers: getAuthHeaders(),
          }),
          api.get("/categories", {
            headers: getAuthHeaders(),
          }),
          api.get("/transactions", {
            headers: getAuthHeaders(),
          }),
        ]);

      setBudgets(budgetsResponse.data.budgets || []);
      setCategories(categoriesResponse.data.categories || []);
      setTransactions(
        transactionsResponse.data.transactions || []
      );
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to load budgets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSpentAmount = (
    budget: Budget
  ) => {
    return transactions
      .filter((transaction) => {
        if (transaction.type !== "EXPENSE") {
          return false;
        }

        const transactionDate = new Date(
          transaction.date
        );

        return (
          transaction.categoryId === budget.categoryId &&
          transactionDate.getMonth() + 1 === budget.month &&
          transactionDate.getFullYear() === budget.year
        );
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  };

  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setMonth(String(currentDate.getMonth() + 1));
    setYear(String(currentDate.getFullYear()));
    setEditingBudgetId(null);
    setShowForm(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid budget amount.");
      return;
    }

    try {
      const payload = {
        amount: Number(amount),
        categoryId,
        month: Number(month),
        year: Number(year),
      };

      if (editingBudgetId) {
        await api.put(
          `/budgets/${editingBudgetId}`,
          payload,
          {
            headers: getAuthHeaders(),
          }
        );
      } else {
        await api.post(
          "/budgets",
          payload,
          {
            headers: getAuthHeaders(),
          }
        );
      }

      resetForm();

      await fetchData();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to save budget"
      );
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setAmount(String(budget.amount));
    setCategoryId(budget.categoryId);
    setMonth(String(budget.month));
    setYear(String(budget.year));
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (
    budget: Budget
  ) => {
    const confirmed = window.confirm(
      `Delete the budget for ${budget.category.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/budgets/${budget.id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      await fetchData();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to delete budget"
      );
    }
  };

  const summary = useMemo(() => {
    const totalBudget = budgets.reduce(
      (total, budget) =>
        total + Number(budget.amount || 0),
      0
    );

    const totalSpent = budgets.reduce(
      (total, budget) =>
        total + getSpentAmount(budget),
      0
    );

    const remaining = totalBudget - totalSpent;

    const percentage =
      totalBudget > 0
        ? Math.round(
            (totalSpent / totalBudget) * 100
          )
        : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage,
    };
  }, [budgets, transactions]);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Plan your spending
            </p>

            <h1>Budgets</h1>

            <p className="subtitle">
              Set spending limits and stay in control
              of your money.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
          >
            <Plus size={18} strokeWidth={2} />

            {showForm
              ? "Cancel"
              : "Add Budget"}
          </button>
        </div>

        {/* Summary */}
        {!loading && budgets.length > 0 && (
          <section className="budget-summary-grid">
            <div className="budget-summary-card">
              <div className="budget-summary-icon">
                <WalletCards
                  size={20}
                  strokeWidth={2}
                />
              </div>

              <div>
                <span>Total budget</span>

                <strong>
                  {formatCurrency(
                    summary.totalBudget
                  )}
                </strong>
              </div>
            </div>

            <div className="budget-summary-card">
              <div className="budget-summary-icon">
                <TrendingUp
                  size={20}
                  strokeWidth={2}
                />
              </div>

              <div>
                <span>Total spent</span>

                <strong>
                  {formatCurrency(
                    summary.totalSpent
                  )}
                </strong>
              </div>
            </div>

            <div className="budget-summary-card">
              <div className="budget-summary-icon">
                {summary.remaining >= 0 ? (
                  <CheckCircle2
                    size={20}
                    strokeWidth={2}
                  />
                ) : (
                  <AlertCircle
                    size={20}
                    strokeWidth={2}
                  />
                )}
              </div>

              <div>
                <span>Remaining</span>

                <strong
                  className={
                    summary.remaining < 0
                      ? "budget-negative"
                      : ""
                  }
                >
                  {formatCurrency(
                    summary.remaining
                  )}
                </strong>
              </div>
            </div>

            <div className="budget-summary-card">
              <div className="budget-summary-icon">
                <CalendarDays
                  size={20}
                  strokeWidth={2}
                />
              </div>

              <div>
                <span>Overall usage</span>

                <strong>
                  {summary.percentage}%
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* Form */}
        {showForm && (
          <form
            className="budget-form"
            onSubmit={handleSubmit}
          >
            <div className="budget-form-heading">
              <div>
                <p className="section-eyebrow">
                  {editingBudgetId
                    ? "EDIT BUDGET"
                    : "NEW BUDGET"}
                </p>

                <h2>
                  {editingBudgetId
                    ? "Update your budget"
                    : "Create a spending limit"}
                </h2>
              </div>
            </div>

            <div className="budget-form-grid">
              <div className="form-group">
                <label htmlFor="budget-category">
                  Category
                </label>

                <select
                  id="budget-category"
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget-amount">
                  Monthly budget
                </label>

                <input
                  id="budget-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="budget-month">
                  Month
                </label>

                <select
                  id="budget-month"
                  value={month}
                  onChange={(e) =>
                    setMonth(e.target.value)
                  }
                >
                  {MONTHS.map((monthItem) => (
                    <option
                      key={monthItem.value}
                      value={monthItem.value}
                    >
                      {monthItem.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget-year">
                  Year
                </label>

                <select
                  id="budget-year"
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value)
                  }
                >
                  {getYears().map((yearItem) => (
                    <option
                      key={yearItem}
                      value={yearItem}
                    >
                      {yearItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="budget-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {editingBudgetId
                  ? "Save Changes"
                  : "Create Budget"}
              </button>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="dashboard-error">
            <AlertCircle size={18} />

            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="budget-loading">
            <div className="loading-spinner" />

            <p>Loading budgets...</p>
          </div>
        )}

        {/* Budget cards */}
        {!loading &&
          !error &&
          budgets.length > 0 && (
            <section className="budgets-section">
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">
                    YOUR PLAN
                  </p>

                  <h2>Spending budgets</h2>
                </div>

                <span className="section-badge">
                  {budgets.length}{" "}
                  {budgets.length === 1
                    ? "budget"
                    : "budgets"}
                </span>
              </div>

              <div className="budgets-grid">
                {budgets.map((budget) => {
                  const budgetAmount =
                    Number(budget.amount) || 0;

                  const spent =
                    getSpentAmount(budget);

                  const remaining =
                    budgetAmount - spent;

                  const percentage =
                    budgetAmount > 0
                      ? Math.round(
                          (spent / budgetAmount) *
                            100
                        )
                      : 0;

                  const progress =
                    Math.min(
                      Math.max(percentage, 0),
                      100
                    );

                  const isOverBudget =
                    spent > budgetAmount;

                  return (
                    <div
                      className="budget-card"
                      key={budget.id}
                    >
                      <div className="budget-card-top">
                        <div className="budget-category">
                          <div
                            className="budget-category-icon"
                            style={{
                              backgroundColor:
                                budget.category
                                  .color ||
                                "#f1f5f9",
                            }}
                          >
                            {budget.category.icon ? (
                              <span>
                                {
                                  budget
                                    .category
                                    .icon
                                }
                              </span>
                            ) : (
                              <WalletCards
                                size={19}
                                strokeWidth={2}
                              />
                            )}
                          </div>

                          <div>
                            <h3>
                              {
                                budget
                                  .category
                                  .name
                              }
                            </h3>

                            <p>
                              {getMonthName(
                                budget.month
                              )}{" "}
                              {budget.year}
                            </p>
                          </div>
                        </div>

                        <div className="budget-actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit budget"
                            onClick={() =>
                              handleEdit(
                                budget
                              )
                            }
                          >
                            <Pencil
                              size={17}
                              strokeWidth={2}
                            />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger"
                            title="Delete budget"
                            onClick={() =>
                              handleDelete(
                                budget
                              )
                            }
                          >
                            <Trash2
                              size={17}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="budget-amount-row">
                        <div>
                          <span>Spent</span>

                          <strong>
                            {formatCurrency(
                              spent
                            )}
                          </strong>
                        </div>

                        <div className="budget-limit">
                          <span>Budget</span>

                          <strong>
                            {formatCurrency(
                              budgetAmount
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="budget-progress">
                        <div className="budget-progress-track">
                          <div
                            className={`budget-progress-bar ${
                              isOverBudget
                                ? "over"
                                : ""
                            }`}
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <span>
                          {percentage}%
                        </span>
                      </div>

                      <div className="budget-footer">
                        <span
                          className={
                            isOverBudget
                              ? "budget-negative"
                              : ""
                          }
                        >
                          {isOverBudget
                            ? `${formatCurrency(
                                Math.abs(
                                  remaining
                                )
                              )} over budget`
                            : `${formatCurrency(
                                remaining
                              )} remaining`}
                        </span>

                        <span>
                          {isOverBudget
                            ? "Review spending"
                            : "On track"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {/* Empty */}
        {!loading &&
          !error &&
          budgets.length === 0 && (
            <div className="budget-empty-state">
              <div className="budget-empty-icon">
                <WalletCards
                  size={28}
                  strokeWidth={1.8}
                />
              </div>

              <h2>No budgets yet</h2>

              <p>
                Create your first budget to start
                controlling your monthly spending.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setShowForm(true)
                }
              >
                <Plus
                  size={18}
                  strokeWidth={2}
                />

                Create your first budget
              </button>
            </div>
          )}
      </main>
    </div>
  );
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function getYears() {
  const currentYear = new Date().getFullYear();

  return [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];
}

function getMonthName(month: number) {
  return (
    MONTHS.find(
      (item) => Number(item.value) === month
    )?.label || "Month"
  );
}

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default Budgets;