
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { Pencil, Plus, Trash2, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#0f172a");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("savora_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchCategories = async () => {
    try {
      setError("");

      const response = await api.get("/categories", {
        headers: getAuthHeaders(),
      });

      setCategories(response.data.categories);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName("");
    setIcon("");
    setColor("#0f172a");
    setEditingCategoryId(null);
    setShowForm(false);
  };

  const handleCreateCategory = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    try {
      if (editingCategoryId) {
        await api.put(
          `/categories/${editingCategoryId}`,
          {
            name,
            icon: icon || null,
            color,
          },
          {
            headers: getAuthHeaders(),
          }
        );
      } else {
        await api.post(
          "/categories",
          {
            name,
            icon: icon || null,
            color,
          },
          {
            headers: getAuthHeaders(),
          }
        );
      }

      resetForm();

      await fetchCategories();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          (editingCategoryId
            ? "Unable to update category"
            : "Unable to create category")
      );
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setName(category.name);
    setIcon(category.icon || "");
    setColor(category.color || "#0f172a");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nThis category can only be deleted if it is not being used by any transactions.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/categories/${category.id}`, {
        headers: getAuthHeaders(),
      });

      await fetchCategories();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to delete category"
      );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Organize your spending
            </p>

            <h1>Categories</h1>

            <p className="subtitle">
              Manage categories for your income and
              expenses.
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
              <>
                <X size={18} strokeWidth={2} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={18} strokeWidth={2} />
                Add Category
              </>
            )}
          </button>
        </div>

        {showForm && (
          <form
            className="category-form"
            onSubmit={handleCreateCategory}
          >
            <div className="category-form-header">
              <div>
                <p className="section-eyebrow">
                  {editingCategoryId
                    ? "EDIT CATEGORY"
                    : "NEW CATEGORY"}
                </p>

                <h2>
                  {editingCategoryId
                    ? "Update category"
                    : "Create a category"}
                </h2>
              </div>

              <button
                type="button"
                className="form-close-button"
                onClick={resetForm}
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="category-name">
                Category name
              </label>

              <input
                id="category-name"
                type="text"
                placeholder="e.g. Food"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </div>

            <div className="category-form-row">
              <div className="form-group">
                <label htmlFor="category-icon">
                  Icon
                </label>

                <input
                  id="category-icon"
                  type="text"
                  placeholder="Optional"
                  maxLength={4}
                  value={icon}
                  onChange={(e) =>
                    setIcon(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-color">
                  Color
                </label>

                <input
                  id="category-color"
                  type="color"
                  value={color}
                  onChange={(e) =>
                    setColor(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="category-form-actions">
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
                {editingCategoryId
                  ? "Save Changes"
                  : "Create Category"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="category-error">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="categories-loading">
            <div className="loading-spinner" />
            <p>Loading categories...</p>
          </div>
        )}

        {!loading && !error && (
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                className="category-card premium-category-card"
                key={category.id}
              >
                <div
                  className="category-icon"
                  style={{
                    backgroundColor:
                      category.color || "#f1f5f9",
                    color: getContrastColor(
                      category.color
                    ),
                  }}
                >
                  {category.icon || "•"}
                </div>

                <div className="category-info">
                  <h2>{category.name}</h2>

                  <p>
                    {category.color ||
                      "Default color"}
                  </p>
                </div>

                <div className="category-actions">
                  <button
                    type="button"
                    className="category-action edit"
                    onClick={() =>
                      handleEdit(category)
                    }
                    aria-label={`Edit ${category.name}`}
                    title="Edit category"
                  >
                    <Pencil
                      size={17}
                      strokeWidth={2}
                    />
                  </button>

                  <button
                    type="button"
                    className="category-action delete"
                    onClick={() =>
                      handleDelete(category)
                    }
                    aria-label={`Delete ${category.name}`}
                    title="Delete category"
                  >
                    <Trash2
                      size={17}
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading &&
          !error &&
          categories.length === 0 && (
            <div className="empty-state">
              <h2>No categories yet</h2>

              <p>
                Create a category to organize your
                transactions.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}

function getContrastColor(
  backgroundColor: string | null
) {
  if (!backgroundColor) {
    return "#0f172a";
  }

  const hex = backgroundColor.replace("#", "");

  if (hex.length !== 6) {
    return "#0f172a";
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness =
    (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? "#0f172a" : "#ffffff";
}

export default Categories;
