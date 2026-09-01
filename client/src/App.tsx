import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/accounts"
            element={<Accounts />}
          />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/budgets"
            element={<Budgets />}
          />

          <Route
  path="/goals"
  element={<Goals />}
/>
        </Route>

        

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;