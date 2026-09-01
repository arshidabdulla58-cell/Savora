import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
}

interface Transaction {
  id: string;
  amount: number | string;
  type: "INCOME" | "EXPENSE";
  description?: string | null;
  date: string;
  account?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  };
}

interface Account {
  id: string;
  name: string;
  balance: number | string;
  type?: string;
}

interface ChartPoint {
  name: string;
  income: number;
  expenses: number;
}

interface SpendingPoint {
  name: string;
  value: number;
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("savora_token");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          dashboardResponse,
          transactionsResponse,
          accountsResponse,
        ] = await Promise.all([
          api.get("/dashboard", { headers }),
          api.get("/transactions", { headers }),
          api.get("/accounts", { headers }),
        ]);

        setData(dashboardResponse.data);

        setTransactions(
          transactionsResponse.data?.transactions || []
        );

        setAccounts(
          accountsResponse.data?.accounts || []
        );
      } catch (error: any) {
        setError(
          error.response?.data?.message ||
            "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const chartData = useMemo<ChartPoint[]>(() => {
    const months: Record<
      string,
      {
        income: number;
        expenses: number;
        date: Date;
      }
    > = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!months[key]) {
        months[key] = {
          income: 0,
          expenses: 0,
          date,
        };
      }

      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "INCOME") {
        months[key].income += amount;
      } else {
        months[key].expenses += amount;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({
        name: formatMonth(key),
        income: value.income,
        expenses: value.expenses,
      }));
  }, [transactions]);

  const spendingData = useMemo<SpendingPoint[]>(() => {
    const categories: Record<string, number> = {};

    transactions
      .filter(
        (transaction) => transaction.type === "EXPENSE"
      )
      .forEach((transaction) => {
        const name =
          transaction.category?.name || "Other";

        categories[name] =
          (categories[name] || 0) +
          (Number(transaction.amount) || 0);
      });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 5);
  }, [transactions]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading Savora...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div>
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard premium-dashboard">

        {/* HEADER */}

        <header className="dashboard-header premium-header">
          <div>
            <p className="eyebrow">
              PERSONAL FINANCE OS
            </p>

            <h1>
              Good morning
              <span className="greeting-mark">
                +
              </span>
            </h1>

            <p className="subtitle">
              Here's your financial overview.
            </p>
          </div>

          <div className="dashboard-brand">
            <div className="brand-mark">
              S
            </div>

            <div>
              <strong>Savora</strong>
              <span>Finance OS</span>
            </div>
          </div>
        </header>


        {/* BALANCE */}

        <section className="premium-balance-card">
          <div className="balance-content">
            <div>
              <p className="balance-label">
                TOTAL BALANCE
              </p>

              <h2>
                {formatCurrency(data.totalBalance)}
              </h2>

              <div className="balance-meta">
                <span className="positive-pill">
                  + {data.savingsRate}% savings
                </span>

                <span>
                  Across {accounts.length}{" "}
                  {accounts.length === 1
                    ? "account"
                    : "accounts"}
                </span>
              </div>
            </div>

            <div className="balance-decoration">
              <div className="balance-circle circle-one" />
              <div className="balance-circle circle-two" />
              <div className="balance-circle circle-three" />
            </div>
          </div>
        </section>


        {/* STATS */}

        <section className="premium-stats-grid">

          <div className="premium-stat-card">
            <div className="stat-top">
              <span className="stat-icon income-icon">
                ↗
              </span>

              <span className="stat-label">
                INCOME
              </span>
            </div>

            <strong>
              {formatCurrency(data.totalIncome)}
            </strong>

            <p>Money coming in</p>
          </div>


          <div className="premium-stat-card">
            <div className="stat-top">
              <span className="stat-icon expense-icon">
                ↘
              </span>

              <span className="stat-label">
                EXPENSES
              </span>
            </div>

            <strong>
              {formatCurrency(data.totalExpenses)}
            </strong>

            <p>Money going out</p>
          </div>


          <div className="premium-stat-card">
            <div className="stat-top">
              <span className="stat-icon savings-icon">
                S
              </span>

              <span className="stat-label">
                SAVINGS
              </span>
            </div>

            <strong>
              {formatCurrency(data.savings)}
            </strong>

            <p>Net savings</p>
          </div>


          <div className="premium-stat-card">
            <div className="stat-top">
              <span className="stat-icon rate-icon">
                %
              </span>

              <span className="stat-label">
                SAVINGS RATE
              </span>
            </div>

            <strong>
              {data.savingsRate}%
            </strong>

            <p>Of your income</p>
          </div>

        </section>


        {/* ANALYTICS */}

        <section className="analytics-section">

          <div className="section-heading">
            <div>
              <p className="section-eyebrow">
                ANALYTICS
              </p>

              <h2>
                Financial performance
              </h2>
            </div>

            <span className="section-badge">
              Last 6 months
            </span>
          </div>


          <div className="analytics-grid">

            {/* CASH FLOW */}

            <div className="analytics-card large-chart-card">

              <div className="analytics-card-header">
                <div>
                  <h3>
                    Income vs expenses
                  </h3>

                  <p>
                    Track your cash flow over time
                  </p>
                </div>
              </div>


              <div className="chart-wrapper">

                {chartData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={chartData}
                    >

                      <defs>

                        <linearGradient
                          id="incomeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopOpacity={0.25}
                          />

                          <stop
                            offset="100%"
                            stopOpacity={0}
                          />
                        </linearGradient>


                        <linearGradient
                          id="expenseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopOpacity={0.18}
                          />

                          <stop
                            offset="100%"
                            stopOpacity={0}
                          />
                        </linearGradient>

                      </defs>


                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />


                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                      />


                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          formatCompactCurrency(
                            value
                          )
                        }
                      />


                      <Tooltip
                        formatter={(
                          value: any,
                          name: any
                        ) => [
                          formatCurrency(
                            Number(value)
                          ),
                          name === "income"
                            ? "Income"
                            : "Expenses",
                        ]}
                      />


                      <Area
                        type="monotone"
                        dataKey="income"
                        strokeWidth={3}
                        fill="url(#incomeGradient)"
                        dot={false}
                      />


                      <Area
                        type="monotone"
                        dataKey="expenses"
                        strokeWidth={3}
                        fill="url(#expenseGradient)"
                        dot={false}
                      />

                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState
                    message="Add transactions to see your cash flow."
                  />
                )}

              </div>


              <div className="chart-legend">

                <span>
                  <i className="legend-dot income-dot" />
                  Income
                </span>

                <span>
                  <i className="legend-dot expense-dot" />
                  Expenses
                </span>

              </div>

            </div>


            {/* SPENDING */}

            <div className="analytics-card spending-card">

              <div className="analytics-card-header">
                <div>
                  <h3>
                    Spending breakdown
                  </h3>

                  <p>
                    Where your money goes
                  </p>
                </div>
              </div>


              <div className="donut-wrapper">

                {spendingData.length > 0 ? (
                  <>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>

                        <Pie
                          data={spendingData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="62%"
                          outerRadius="82%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {spendingData.map(
                            (_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  DONUT_COLORS[
                                    index %
                                      DONUT_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(value: any) =>
                            formatCurrency(
                              Number(value)
                            )
                          }
                        />

                      </PieChart>
                    </ResponsiveContainer>


                    <div className="donut-center">
                      <span>Total</span>

                      <strong>
                        {formatCurrency(
                          data.totalExpenses
                        )}
                      </strong>
                    </div>
                  </>
                ) : (
                  <EmptyChartState
                    message="No expenses yet."
                  />
                )}

              </div>


              <div className="spending-list">

                {spendingData.map(
                  (item, index) => (
                    <div
                      className="spending-item"
                      key={item.name}
                    >

                      <div className="spending-name">

                        <i
                          style={{
                            background:
                              DONUT_COLORS[
                                index %
                                  DONUT_COLORS.length
                              ],
                          }}
                        />

                        <span>
                          {item.name}
                        </span>

                      </div>

                      <strong>
                        {formatCurrency(item.value)}
                      </strong>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>
        </section>


        {/* BOTTOM SECTION */}

        <section className="dashboard-bottom-grid">

          {/* RECENT TRANSACTIONS */}

          <div className="dashboard-panel">

            <div className="panel-header">

              <div>
                <p className="section-eyebrow">
                  ACTIVITY
                </p>

                <h2>
                  Recent transactions
                </h2>
              </div>

              <a href="/transactions">
                View all →
              </a>

            </div>


            {recentTransactions.length > 0 ? (

              <div className="premium-transactions-list">

                {recentTransactions.map(
                  (transaction) => (

                    <div
                      className="premium-transaction"
                      key={transaction.id}
                    >

                      <div className="transaction-avatar">
                        {transaction.category?.icon ||
                          getTransactionIcon(
                            transaction.type
                          )}
                      </div>


                      <div className="transaction-main">

                        <strong>
                          {transaction.description ||
                            transaction.category
                              ?.name ||
                            "Transaction"}
                        </strong>

                        <span>
                          {transaction.category
                            ?.name ||
                            "Other"}{" "}
                          ·{" "}
                          {formatDate(
                            transaction.date
                          )}
                        </span>

                      </div>


                      <strong
                        className={`premium-transaction-amount ${
                          transaction.type ===
                          "INCOME"
                            ? "income"
                            : "expense"
                        }`}
                      >
                        {transaction.type ===
                        "INCOME"
                          ? "+"
                          : "-"}
                        {formatCurrency(
                          Number(
                            transaction.amount
                          )
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="empty-panel">

                <span className="empty-panel-icon">
                  —
                </span>

                <p>
                  No transactions yet.
                </p>

              </div>

            )}

          </div>


          {/* ACCOUNTS */}

          <div className="dashboard-panel">

            <div className="panel-header">

              <div>
                <p className="section-eyebrow">
                  MONEY
                </p>

                <h2>
                  Your accounts
                </h2>
              </div>

              <a href="/accounts">
                View all →
              </a>

            </div>


            {accounts.length > 0 ? (

              <div className="premium-accounts-list">

                {accounts
                  .slice(0, 4)
                  .map((account) => (

                    <div
                      className="premium-account"
                      key={account.id}
                    >

                      <div className="account-avatar">
                        {getAccountIcon(
                          account.type
                        )}
                      </div>


                      <div className="account-main">

                        <strong>
                          {account.name}
                        </strong>

                        <span>
                          {account.type ||
                            "Account"}
                        </span>

                      </div>


                      <strong className="account-value">
                        {formatCurrency(
                          Number(
                            account.balance
                          )
                        )}
                      </strong>

                    </div>

                  ))}

              </div>

            ) : (

              <div className="empty-panel">

                <span className="empty-panel-icon">
                  —
                </span>

                <p>
                  No accounts yet.
                </p>

              </div>

            )}

          </div>

        </section>

      </main>
    </div>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}


function formatCompactCurrency(value: number) {
  const number = Number(value) || 0;

  if (number >= 10000000) {
    return `INR ${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `INR ${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `INR ${(number / 1000).toFixed(1)}K`;
  }

  return `INR ${number}`;
}


function formatMonth(value: string) {
  const [year, month] = value.split("-");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString("en-IN", {
    month: "short",
  });
}


function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}


function getTransactionIcon(
  type: "INCOME" | "EXPENSE"
) {
  return type === "INCOME" ? "↗" : "↘";
}


function getAccountIcon(type?: string) {
  const value = String(type || "").toLowerCase();

  if (value.includes("cash")) {
    return "C";
  }

  if (
    value.includes("bank") ||
    value.includes("saving")
  ) {
    return "B";
  }

  if (
    value.includes("credit") ||
    value.includes("card")
  ) {
    return "K";
  }

  return "A";
}


function EmptyChartState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="empty-chart">
      <span>—</span>
      <p>{message}</p>
    </div>
  );
}


const DONUT_COLORS = [
  "#0f172a",
  "#334155",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
];


export default Dashboard;
