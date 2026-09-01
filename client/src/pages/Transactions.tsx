import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Edit3,
  Plus,
  ReceiptText,
  Tag,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number | string;
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
  description: string | null;
  date: string;
  account: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] =
    useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem("savora_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchTransactions = async () => {
    const response = await api.get("/transactions", {
      headers: getAuthHeaders(),
    });

    setTransactions(response.data.transactions || []);
  };

  const fetchAccounts = async () => {
    const response = await api.get("/accounts", {
      headers: getAuthHeaders(),
    });

    setAccounts(response.data.accounts || []);
  };

  const fetchCategories = async () => {
    const response = await api.get("/categories", {
      headers: getAuthHeaders(),
    });

    setCategories(response.data.categories || []);
  };

  const loadData = async () => {
    try {
      setError("");

      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchCategories(),
      ]);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to load transaction data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     FORM RESET
     ========================================================= */

  const resetForm = () => {
    setAmount("");
    setType("EXPENSE");
    setDescription("");
    setDate(
      new Date().toISOString().split("T")[0]
    );
    setAccountId("");
    setCategoryId("");
    setEditingId(null);
  };

  /* =========================================================
     OPEN CREATE FORM
     ========================================================= */

  const handleAddTransaction = () => {
    resetForm();
    setError("");
    setShowForm(true);
  };

  /* =========================================================
     OPEN EDIT FORM
     ========================================================= */

  const handleEditTransaction = (
    transaction: Transaction
  ) => {
    setEditingId(transaction.id);

    setAmount(String(transaction.amount));
    setType(transaction.type);
    setDescription(
      transaction.description || ""
    );

    const transactionDate =
      new Date(transaction.date);

    if (!Number.isNaN(transactionDate.getTime())) {
      setDate(
        transactionDate
          .toISOString()
          .split("T")[0]
      );
    }

    setAccountId(transaction.account.id);
    setCategoryId(transaction.category.id);

    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     CLOSE FORM
     ========================================================= */

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
    setError("");
  };

  /* =========================================================
     CREATE / UPDATE
     ========================================================= */

  const handleSubmitTransaction = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!accountId || !categoryId) {
      setError(
        "Please select an account and category."
      );
      return;
    }

    try {
      const payload = {
        amount: Number(amount),
        type,
        description: description || undefined,
        date,
        accountId,
        categoryId,
      };

      if (editingId) {
        await api.put(
          `/transactions/${editingId}`,
          payload,
          {
            headers: getAuthHeaders(),
          }
        );
      } else {
        await api.post(
          "/transactions",
          payload,
          {
            headers: getAuthHeaders(),
          }
        );
      }

      handleCloseForm();

      await loadData();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          (editingId
            ? "Unable to update transaction"
            : "Unable to create transaction")
      );
    }
  };

  /* =========================================================
     DELETE TRANSACTION
     ========================================================= */

  const handleDeleteTransaction = async (
    transaction: Transaction
  ) => {
    const confirmed = window.confirm(
      `Delete this transaction?\n\n${
        transaction.description ||
        transaction.category.name
      }\n${transaction.type === "INCOME" ? "+" : "-"} INR ${Number(
        transaction.amount
      ).toLocaleString("en-IN")}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(transaction.id);
      setError("");

      await api.delete(
        `/transactions/${transaction.id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      await loadData();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to delete transaction"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard premium-transactions-page">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="page-header transactions-page-header">
          <div>
            <p className="eyebrow">
              YOUR ACTIVITY
            </p>

            <h1>Transactions</h1>

            <p className="subtitle">
              Keep track of every income and expense.
            </p>
          </div>

          <button
            className="primary-button transactions-add-button"
            onClick={
              showForm
                ? handleCloseForm
                : handleAddTransaction
            }
          >
            {showForm ? (
              <>
                <X
                  size={18}
                  strokeWidth={2}
                />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus
                  size={18}
                  strokeWidth={2.2}
                />
                <span>Add Transaction</span>
              </>
            )}
          </button>
        </header>


        {/* =====================================================
            CREATE / EDIT FORM
        ===================================================== */}

        {showForm && (
          <form
            className="premium-transaction-form"
            onSubmit={handleSubmitTransaction}
          >
            <div className="transaction-form-header">

              <div className="form-heading-icon">
                {editingId ? (
                  <Edit3
                    size={21}
                    strokeWidth={1.9}
                  />
                ) : (
                  <ReceiptText
                    size={21}
                    strokeWidth={1.9}
                  />
                )}
              </div>

              <div>
                <p className="section-eyebrow">
                  {editingId
                    ? "EDIT TRANSACTION"
                    : "NEW TRANSACTION"}
                </p>

                <h2>
                  {editingId
                    ? "Edit transaction"
                    : "Add transaction"}
                </h2>

                <p>
                  {editingId
                    ? "Update your transaction details."
                    : "Record your income or expense."}
                </p>
              </div>

            </div>


            {/* TRANSACTION TYPE */}

            <div className="transaction-type-selector">

              <button
                type="button"
                className={
                  type === "EXPENSE"
                    ? "transaction-type-option active expense-option"
                    : "transaction-type-option"
                }
                onClick={() =>
                  setType("EXPENSE")
                }
              >
                <ArrowDownLeft
                  size={18}
                  strokeWidth={2}
                />

                <span>
                  <strong>Expense</strong>
                  <small>
                    Money going out
                  </small>
                </span>
              </button>


              <button
                type="button"
                className={
                  type === "INCOME"
                    ? "transaction-type-option active income-option"
                    : "transaction-type-option"
                }
                onClick={() =>
                  setType("INCOME")
                }
              >
                <ArrowUpRight
                  size={18}
                  strokeWidth={2}
                />

                <span>
                  <strong>Income</strong>
                  <small>
                    Money coming in
                  </small>
                </span>
              </button>

            </div>


            {/* FORM GRID */}

            <div className="transaction-form-grid">

              {/* Amount */}

              <div className="form-group">
                <label htmlFor="transaction-amount">
                  Amount
                </label>

                <div className="premium-input-wrapper amount-input-wrapper">
                  <span>INR</span>

                  <input
                    id="transaction-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    required
                  />
                </div>
              </div>


              {/* Date */}

              <div className="form-group">
                <label htmlFor="transaction-date">
                  Date
                </label>

                <div className="premium-input-wrapper">

                  <CalendarDays
                    size={17}
                    strokeWidth={1.9}
                  />

                  <input
                    id="transaction-date"
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    required
                  />

                </div>
              </div>


              {/* Description */}

              <div className="form-group full-width">
                <label htmlFor="transaction-description">
                  Description
                </label>

                <div className="premium-input-wrapper">

                  <ReceiptText
                    size={17}
                    strokeWidth={1.9}
                  />

                  <input
                    id="transaction-description"
                    type="text"
                    placeholder="e.g. Grocery shopping"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                  />

                </div>
              </div>


              {/* Account */}

              <div className="form-group">
                <label htmlFor="transaction-account">
                  Account
                </label>

                <div className="premium-input-wrapper select-wrapper">

                  <WalletCards
                    size={17}
                    strokeWidth={1.9}
                  />

                  <select
                    id="transaction-account"
                    value={accountId}
                    onChange={(e) =>
                      setAccountId(
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select account
                    </option>

                    {accounts.map(
                      (account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.name}
                        </option>
                      )
                    )}
                  </select>

                </div>
              </div>


              {/* Category */}

              <div className="form-group">
                <label htmlFor="transaction-category">
                  Category
                </label>

                <div className="premium-input-wrapper select-wrapper">

                  <Tag
                    size={17}
                    strokeWidth={1.9}
                  />

                  <select
                    id="transaction-category"
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>

                </div>
              </div>

            </div>


            {/* FORM ERROR */}

            {error && (
              <div className="transactions-inline-error">
                {error}
              </div>
            )}


            {/* FORM ACTIONS */}

            <div className="transaction-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {editingId ? (
                  <>
                    <Edit3
                      size={17}
                      strokeWidth={2.2}
                    />

                    <span>
                      Save Changes
                    </span>
                  </>
                ) : (
                  <>
                    <Plus
                      size={17}
                      strokeWidth={2.2}
                    />

                    <span>
                      Create Transaction
                    </span>
                  </>
                )}
              </button>

            </div>
          </form>
        )}


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && !showForm && (
          <div className="transactions-error">
            {error}
          </div>
        )}


        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="transactions-loading">
            <div className="loading-spinner" />
            <p>
              Loading transactions...
            </p>
          </div>
        )}


        {/* =====================================================
            TRANSACTIONS
        ===================================================== */}

        {!loading && !error && (
          <section className="transactions-section">

            <div className="transactions-section-header">

              <div>
                <p className="section-eyebrow">
                  ACTIVITY
                </p>

                <h2>
                  All transactions
                </h2>
              </div>

              <span className="transactions-count">
                {transactions.length}{" "}
                {transactions.length === 1
                  ? "transaction"
                  : "transactions"}
              </span>

            </div>


            {transactions.length > 0 ? (

              <div className="premium-transactions-list">

                {transactions.map(
                  (transaction) => {

                    const isIncome =
                      transaction.type ===
                      "INCOME";

                    const categoryColor =
                      transaction.category
                        ?.color ||
                      "#64748b";

                    const isDeleting =
                      deletingId ===
                      transaction.id;

                    return (
                      <article
                        className="premium-transaction-card"
                        key={transaction.id}
                      >

                        {/* ICON */}

                        <div
                          className={`premium-transaction-icon ${
                            isIncome
                              ? "transaction-income-icon"
                              : "transaction-expense-icon"
                          }`}
                          style={{
                            borderColor:
                              `${categoryColor}33`,
                            background:
                              `${categoryColor}12`,
                            color:
                              categoryColor,
                          }}
                        >
                          {isIncome ? (
                            <ArrowUpRight
                              size={20}
                              strokeWidth={2}
                            />
                          ) : (
                            <ArrowDownLeft
                              size={20}
                              strokeWidth={2}
                            />
                          )}
                        </div>


                        {/* CONTENT */}

                        <div className="premium-transaction-content">

                          <div className="premium-transaction-title-row">

                            <h3>
                              {transaction.description ||
                                transaction
                                  .category
                                  .name}
                            </h3>

                            <strong
                              className={
                                isIncome
                                  ? "premium-income-amount"
                                  : "premium-expense-amount"
                              }
                            >
                              {isIncome
                                ? "+"
                                : "-"}
                              {" "}INR{" "}
                              {Number(
                                transaction.amount
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                          </div>


                          {/* META */}

                          <div className="premium-transaction-meta">

                            <span>
                              <Tag
                                size={13}
                                strokeWidth={2}
                              />

                              {
                                transaction
                                  .category
                                  .name
                              }
                            </span>

                            <span className="meta-separator">
                              ·
                            </span>

                            <span>
                              <WalletCards
                                size={13}
                                strokeWidth={2}
                              />

                              {
                                transaction
                                  .account
                                  .name
                              }
                            </span>

                            <span className="meta-separator">
                              ·
                            </span>

                            <span>
                              <CalendarDays
                                size={13}
                                strokeWidth={2}
                              />

                              {formatDate(
                                transaction.date
                              )}
                            </span>

                          </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="transaction-card-actions">

                          <button
                            type="button"
                            className="transaction-action-button edit-transaction-button"
                            onClick={() =>
                              handleEditTransaction(
                                transaction
                              )
                            }
                            disabled={isDeleting}
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Edit3
                              size={17}
                              strokeWidth={2}
                            />
                          </button>


                          <button
                            type="button"
                            className="transaction-action-button delete-transaction-button"
                            onClick={() =>
                              handleDeleteTransaction(
                                transaction
                              )
                            }
                            disabled={isDeleting}
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            {isDeleting ? (
                              <span className="action-spinner" />
                            ) : (
                              <Trash2
                                size={17}
                                strokeWidth={2}
                              />
                            )}
                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            ) : (

              /* EMPTY STATE */

              <div className="premium-empty-transactions">

                <div className="empty-transaction-icon">
                  <ReceiptText
                    size={25}
                    strokeWidth={1.8}
                  />
                </div>

                <h2>
                  No transactions yet
                </h2>

                <p>
                  Your income and expenses will
                  appear here once you add your
                  first transaction.
                </p>

                <button
                  className="primary-button"
                  onClick={
                    handleAddTransaction
                  }
                >
                  <Plus
                    size={17}
                    strokeWidth={2.2}
                  />

                  <span>
                    Add your first transaction
                  </span>
                </button>

              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default Transactions;