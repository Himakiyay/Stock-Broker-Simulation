import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "../pages/AppShell";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import OrdersPage from "../pages/OrdersPage";
import PositionsPage from "../pages/PositionsPage";
import PortfolioPage from "../pages/PortfolioPage";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "positions", element: <PositionsPage /> },
          { path: "portfolio", element: <PortfolioPage /> },
        ],
      },
    ],
  },
]);
