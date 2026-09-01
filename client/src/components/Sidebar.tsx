import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  Tags,
  ChartNoAxesCombined,
  Target,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("savora_token");
    localStorage.removeItem("savora_user");

    navigate("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar desktop-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-brand-mark">S</div>

          <div>
            <h2>Savora</h2>
            <span>Finance OS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">
            <LayoutDashboard
              className="nav-icon"
              size={19}
              strokeWidth={2}
            />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/accounts">
            <WalletCards
              className="nav-icon"
              size={19}
              strokeWidth={2}
            />
            <span>Accounts</span>
          </NavLink>

          <NavLink to="/transactions">
            <ArrowLeftRight
              className="nav-icon"
              size={19}
              strokeWidth={2}
            />
            <span>Transactions</span>
          </NavLink>

          <NavLink to="/categories">
            <Tags
              className="nav-icon"
              size={19}
              strokeWidth={2}
            />
            <span>Categories</span>
          </NavLink>

          <NavLink to="/budgets">
            <ChartNoAxesCombined
              className="nav-icon"
              size={19}
              strokeWidth={2}
            />
            <span>Budgets</span>
          </NavLink>

          <NavLink to="/goals">
            <Target
              className="nav-icon"
              size={19}
              strokeWidth={2}
            />
            <span>Goals</span>
          </NavLink>
        </nav>

        {/* Desktop Logout */}
        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut
            className="nav-icon"
            size={19}
            strokeWidth={2}
          />

          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/dashboard">
          <LayoutDashboard
            className="mobile-nav-icon"
            size={20}
            strokeWidth={2}
          />
          <span>Home</span>
        </NavLink>

        <NavLink to="/accounts">
          <WalletCards
            className="mobile-nav-icon"
            size={20}
            strokeWidth={2}
          />
          <span>Accounts</span>
        </NavLink>

        <NavLink to="/transactions">
          <ArrowLeftRight
            className="mobile-nav-icon"
            size={20}
            strokeWidth={2}
          />
          <span>Transactions</span>
        </NavLink>

        <NavLink to="/categories">
          <Tags
            className="mobile-nav-icon"
            size={20}
            strokeWidth={2}
          />
          <span>Categories</span>
        </NavLink>

        <NavLink to="/budgets">
          <ChartNoAxesCombined
            className="mobile-nav-icon"
            size={20}
            strokeWidth={2}
          />
          <span>Budgets</span>
        </NavLink>

        <NavLink to="/goals">
          <Target
            className="mobile-nav-icon"
            size={20}
            strokeWidth={2}
          />
          <span>Goals</span>
        </NavLink>
      </nav>
    </>
  );
}

export default Sidebar;