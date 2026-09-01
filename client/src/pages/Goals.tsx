import { useEffect, useState } from "react";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  CheckCircle2,
  PauseCircle,
  CircleDollarSign,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

interface Goal {
  id: string;
  name: string;
  target: number | string;
  current: number | string;
  deadline: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
}

function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] =
    useState<"ACTIVE" | "COMPLETED" | "PAUSED">("ACTIVE");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("savora_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchGoals = async () => {
    try {
      setError("");

      const response = await api.get("/goals", {
        headers: getAuthHeaders(),
      });

      setGoals(response.data.goals);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to load goals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const resetForm = () => {
    setName("");
    setTarget("");
    setCurrent("");
    setDeadline("");
    setStatus("ACTIVE");
    setEditingGoalId(null);
    setShowForm(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    try {
      const data = {
        name,
        target: Number(target),
        current: Number(current || 0),
        deadline: deadline || null,
        status,
      };

      if (editingGoalId) {
        await api.put(
          `/goals/${editingGoalId}`,
          data,
          {
            headers: getAuthHeaders(),
          }
        );
      } else {
        await api.post(
          "/goals",
          data,
          {
            headers: getAuthHeaders(),
          }
        );
      }

      resetForm();
      await fetchGoals();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to save goal"
      );
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);

    setName(goal.name);
    setTarget(String(goal.target));
    setCurrent(String(goal.current));
    setDeadline(
      goal.deadline
        ? new Date(goal.deadline)
            .toISOString()
            .split("T")[0]
        : ""
    );
    setStatus(goal.status);

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (goal: Goal) => {
    const confirmed = window.confirm(
      `Delete "${goal.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/goals/${goal.id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      await fetchGoals();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to delete goal"
      );
    }
  };

  const getProgress = (goal: Goal) => {
    const targetAmount = Number(goal.target);
    const currentAmount = Number(goal.current);

    if (targetAmount <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (currentAmount / targetAmount) * 100
      )
    );
  };

  const formatCurrency = (value: number | string) => {
    return `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return "No deadline";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (goalStatus: Goal["status"]) => {
    if (goalStatus === "COMPLETED") {
      return "Completed";
    }

    if (goalStatus === "PAUSED") {
      return "Paused";
    }

    return "Active";
  };

  const getStatusIcon = (goalStatus: Goal["status"]) => {
    if (goalStatus === "COMPLETED") {
      return <CheckCircle2 size={15} />;
    }

    if (goalStatus === "PAUSED") {
      return <PauseCircle size={15} />;
    }

    return <Target size={15} />;
  };

  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.target),
    0
  );

  const totalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.current),
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.status === "COMPLETED"
  ).length;

  const activeGoals = goals.filter(
    (goal) => goal.status === "ACTIVE"
  ).length;

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard">
        <div className="page-header">
          <div>
            <p className="eyebrow">Plan your future</p>

            <h1>Goals</h1>

            <p className="subtitle">
              Track your savings goals and turn plans into progress.
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
            {showForm ? (
              "Cancel"
            ) : (
              <>
                <Plus size={18} />
                Add Goal
              </>
            )}
          </button>
        </div>

        <div className="goals-summary-grid">
          <div className="goal-summary-card">
            <div className="goal-summary-icon">
              <Target size={20} />
            </div>

            <div>
              <span>Total Goals</span>
              <strong>{goals.length}</strong>
            </div>
          </div>

          <div className="goal-summary-card">
            <div className="goal-summary-icon">
              <CircleDollarSign size={20} />
            </div>

            <div>
              <span>Total Saved</span>
              <strong>
                {formatCurrency(totalSaved)}
              </strong>
            </div>
          </div>

          <div className="goal-summary-card">
            <div className="goal-summary-icon">
              <Target size={20} />
            </div>

            <div>
              <span>Total Target</span>
              <strong>
                {formatCurrency(totalTarget)}
              </strong>
            </div>
          </div>

          <div className="goal-summary-card">
            <div className="goal-summary-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Completed</span>
              <strong>
                {completedGoals}
              </strong>
            </div>
          </div>
        </div>

        {showForm && (
          <form
            className="goal-form"
            onSubmit={handleSubmit}
          >
            <div className="goal-form-heading">
              <p className="eyebrow">
                {editingGoalId
                  ? "Update your goal"
                  : "Create a new goal"}
              </p>

              <h2>
                {editingGoalId
                  ? "Edit Goal"
                  : "New Savings Goal"}
              </h2>
            </div>

            <div className="goal-form-grid">
              <div className="form-group">
                <label htmlFor="goal-name">
                  Goal name
                </label>

                <input
                  id="goal-name"
                  type="text"
                  placeholder="e.g. Emergency Fund"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal-target">
                  Target amount
                </label>

                <input
                  id="goal-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="100000"
                  value={target}
                  onChange={(e) =>
                    setTarget(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal-current">
                  Current saved
                </label>

                <input
                  id="goal-current"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={current}
                  onChange={(e) =>
                    setCurrent(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal-deadline">
                  Deadline
                </label>

                <input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) =>
                    setDeadline(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal-status">
                  Status
                </label>

                <select
                  id="goal-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as Goal["status"]
                    )
                  }
                >
                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="PAUSED">
                    Paused
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>
                </select>
              </div>
            </div>

            <div className="goal-form-actions">
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
                {editingGoalId
                  ? "Save Changes"
                  : "Create Goal"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="dashboard-error">
            {error}
          </p>
        )}

        {loading && (
          <div className="goal-loading">
            <Target size={22} />
            <span>Loading goals...</span>
          </div>
        )}

        {!loading && !error && goals.length > 0 && (
          <>
            <div className="goals-section-header">
              <div>
                <p className="eyebrow">
                  Your progress
                </p>

                <h2>Financial Goals</h2>
              </div>

              <span className="goals-active-count">
                {activeGoals} active
              </span>
            </div>

            <div className="goals-grid">
              {goals.map((goal) => {
                const progress = getProgress(goal);
                const isCompleted =
                  goal.status === "COMPLETED";

                return (
                  <div
                    className="goal-card"
                    key={goal.id}
                  >
                    <div className="goal-card-top">
                      <div className="goal-card-title">
                        <div className="goal-icon">
                          <Target
                            size={21}
                            strokeWidth={2}
                          />
                        </div>

                        <div>
                          <h3>{goal.name}</h3>

                          <div
                            className={`goal-status ${goal.status.toLowerCase()}`}
                          >
                            {getStatusIcon(goal.status)}
                            <span>
                              {getStatusLabel(
                                goal.status
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="goal-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() =>
                            handleEdit(goal)
                          }
                          aria-label={`Edit ${goal.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() =>
                            handleDelete(goal)
                          }
                          aria-label={`Delete ${goal.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="goal-values">
                      <div>
                        <span>Saved</span>
                        <strong>
                          {formatCurrency(
                            goal.current
                          )}
                        </strong>
                      </div>

                      <div className="goal-target">
                        <span>Target</span>
                        <strong>
                          {formatCurrency(
                            goal.target
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="goal-progress">
                      <div className="goal-progress-track">
                        <div
                          className={`goal-progress-bar ${
                            isCompleted
                              ? "completed"
                              : ""
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <span>
                        {Math.round(progress)}%
                      </span>
                    </div>

                    <div className="goal-footer">
                      <span>
                        {isCompleted
                          ? "Goal completed"
                          : `${formatCurrency(
                              Math.max(
                                0,
                                Number(goal.target) -
                                  Number(goal.current)
                              )
                            )} remaining`}
                      </span>

                      <span className="goal-deadline">
                        <CalendarDays size={14} />
                        {formatDate(
                          goal.deadline
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading &&
          !error &&
          goals.length === 0 && (
            <div className="goal-empty-state">
              <div className="goal-empty-icon">
                <Target size={28} />
              </div>

              <h2>No goals yet</h2>

              <p>
                Create your first savings goal and start
                tracking your progress.
              </p>

              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} />
                Create Your First Goal
              </button>
            </div>
          )}
      </main>
    </div>
  );
}

export default Goals;