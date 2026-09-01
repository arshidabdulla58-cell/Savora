import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import {
  Wallet,
  Landmark,
  CreditCard,
  TrendingUp,
  Plus,
  X,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number | string;
}

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [balance, setBalance] = useState("");

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("savora_token");

      const response = await api.get("/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAccounts(response.data.accounts);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to load accounts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    try {
      const token = localStorage.getItem("savora_token");

      await api.post(
        "/accounts",
        {
          name,
          type,
          balance: Number(balance),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setName("");
      setType("BANK");
      setBalance("");
      setShowForm(false);

      await fetchAccounts();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to create account"
      );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard premium-accounts-page">
        {/* Header */}
        <header className="page-header accounts-page-header">
          <div>
            <p className="eyebrow">YOUR MONEY</p>

            <h1>Accounts</h1>

            <p className="subtitle">
              Manage your accounts and keep your balances organized.
            </p>
          </div>

          <button
            className="primary-button accounts-add-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <X size={18} strokeWidth={2} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus size={18} strokeWidth={2} />
                <span>Add Account</span>
              </>
            )}
          </button>
        </header>

        {/* Create Account Form */}
        {showForm && (
          <form
            className="account-form premium-account-form"
            onSubmit={handleCreateAccount}
          >
            <div className="form-header">
              <div>
                <p className="section-eyebrow">NEW ACCOUNT</p>
                <h2>Add an account</h2>
                <p>
                  Add a bank, wallet, card, or investment account.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="account-name">
                Account name
              </label>

              <input
                id="account-name"
                type="text"
                placeholder="e.g. Main Bank Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="account-type">
                Account type
              </label>

              <select
                id="account-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="BANK">Bank</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">
                  Credit Card
                </option>
                <option value="INVESTMENT">
                  Investment
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="account-balance">
                Starting balance
              </label>

              <input
                id="account-balance"
                type="number"
                step="0.01"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Create Account
            </button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="accounts-error">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="accounts-loading">
            <div className="loading-spinner" />
            <p>Loading accounts...</p>
          </div>
        )}

        {/* Accounts */}
        {!loading && !error && accounts.length > 0 && (
          <section className="premium-accounts-grid">
            {accounts.map((account) => {
              const AccountIcon = getAccountIcon(account.type);

              return (
                <article
                  className="premium-account-card"
                  key={account.id}
                >
                  <div className="premium-account-top">
                    <div
                      className={`premium-account-icon ${getAccountTone(
                        account.type
                      )}`}
                    >
                      <AccountIcon
                        size={22}
                        strokeWidth={2}
                      />
                    </div>

                    <span className="account-type-badge">
                      {formatAccountType(account.type)}
                    </span>
                  </div>

                  <div className="premium-account-info">
                    <h2>{account.name}</h2>

                    <p>
                      {getAccountDescription(account.type)}
                    </p>
                  </div>

                  <div className="premium-account-bottom">
                    <span className="balance-label">
                      CURRENT BALANCE
                    </span>

                    <strong>
                      {formatCurrency(
                        Number(account.balance)
                      )}
                    </strong>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Empty State */}
        {!loading &&
          !error &&
          accounts.length === 0 && (
            <div className="premium-empty-accounts">
              <div className="empty-account-icon">
                <Wallet
                  size={28}
                  strokeWidth={1.8}
                />
              </div>

              <h2>No accounts yet</h2>

              <p>
                Add your first account to start tracking
                your money.
              </p>

              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} />
                Add your first account
              </button>
            </div>
          )}
      </main>
    </div>
  );
}

function getAccountIcon(type: string) {
  switch (type) {
    case "CASH":
      return Wallet;

    case "CREDIT_CARD":
      return CreditCard;

    case "INVESTMENT":
      return TrendingUp;

    case "BANK":
    default:
      return Landmark;
  }
}

function getAccountTone(type: string) {
  switch (type) {
    case "CASH":
      return "cash";

    case "CREDIT_CARD":
      return "credit";

    case "INVESTMENT":
      return "investment";

    case "BANK":
    default:
      return "bank";
  }
}

function formatAccountType(type: string) {
  switch (type) {
    case "CREDIT_CARD":
      return "Credit Card";

    case "INVESTMENT":
      return "Investment";

    case "CASH":
      return "Cash";

    case "BANK":
    default:
      return "Bank";
  }
}

function getAccountDescription(type: string) {
  switch (type) {
    case "CASH":
      return "Physical cash";

    case "CREDIT_CARD":
      return "Credit account";

    case "INVESTMENT":
      return "Investment portfolio";

    case "BANK":
    default:
      return "Bank account";
  }
}

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

export default Accounts;
