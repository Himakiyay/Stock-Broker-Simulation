import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function NavItem({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        textDecoration: "none",
        color: active ? "white" : "#cfcfcf",
        background: active ? "#2d6cdf" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

export default function AppShell() {
  const { logout } = useAuth();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh", background: "#0f1115" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #242833" }}>
        <h2 style={{ marginTop: 0, color: "white" }}>Stock Broker</h2>

        <nav style={{ display: "grid", gap: 6, marginTop: 12 }}>
          <NavItem to="/app" label="Dashboard" />
          <NavItem to="/app/orders" label="Orders" />
          <NavItem to="/app/positions" label="Positions" />
          <NavItem to="/app/portfolio" label="Portfolio" />
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #2a2f3b",
            background: "#161a22",
            color: "white",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Logout
        </button>
      </aside>

      <main style={{ padding: 24, color: "white" }}>
        <Outlet />
      </main>
    </div>
  );
}
