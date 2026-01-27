import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const nextPath = location.state?.from ?? "/app";

  const canSubmit = useMemo(() => {
    const u = usernameOrEmail.trim();
    return u.length > 0 && password.length > 0;
  }, [usernameOrEmail, password]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await login(usernameOrEmail.trim(), password);
      setToken(res.access_token);
      navigate(nextPath, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* Left panel */}
        <div style={styles.left}>
          <div style={styles.brandRow}>
            <div style={styles.brandDot} />
            <div style={styles.brandName}>Stock Broker</div>
          </div>

          <h1 style={styles.heroTitle}>Paper trading, but it feels real.</h1>
          <p style={styles.heroSub}>
            Simulated live quotes, orders, positions, and portfolio tracking — powered by FastAPI + Postgres + React.
          </p>

          <div style={styles.bullets}>
            <Bullet text="Live quote polling per symbol" />
            <Bullet text="Market tick engine writes prices + history" />
            <Bullet text="Instant buy/sell with cash + position checks" />
          </div>

          <div style={styles.smallNote}>
            Tip: You can view API docs at <code style={styles.codeInline}>/docs</code>.
          </div>
        </div>

        {/* Right card */}
        <div style={styles.right}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Welcome back</div>
              <div style={styles.cardSub}>Sign in to continue.</div>
            </div>

            <form onSubmit={onSubmit} style={styles.form}>
              <label style={styles.label}>
                Email
                <input
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={styles.input}
                  autoComplete="username"
                />
              </label>

              <label style={styles.label}>
                Password
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  style={styles.input}
                  autoComplete="current-password"
                />
              </label>

              {err && <div style={styles.error}>{err}</div>}

              <button
                disabled={loading || !canSubmit}
                style={{
                  ...styles.button,
                  ...(loading || !canSubmit ? styles.buttonDisabled : styles.buttonActive),
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div style={styles.footerRow}>
                <span style={{ opacity: 0.8 }}>No account?</span>
                <Link to="/register" style={styles.link}>
                  Create one
                </Link>
              </div>
            </form>
          </div>

          <div style={styles.rightNote}>
            <span style={{ opacity: 0.75 }}>Frontend:</span>{" "}
            <code style={styles.codePill}>http://localhost:5173</code>{" "}
            <span style={{ opacity: 0.75 }}>API:</span>{" "}
            <code style={styles.codePill}>http://localhost:8000</code>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div style={styles.bullet}>
      <div style={styles.bulletDot} />
      <div>{text}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 24,
    display: "grid",
    placeItems: "center",
    color: "white",
    background:
      "radial-gradient(1100px 700px at 15% 20%, rgba(45,108,223,.28), transparent 55%), radial-gradient(900px 700px at 85% 70%, rgba(61,220,132,.18), transparent 55%), #0b0e14",
  },
  shell: {
    width: "min(1040px, 100%)",
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 22,
    alignItems: "stretch",
  },

  left: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 18,
    padding: 24,
    background: "rgba(255,255,255,.03)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.40)",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "linear-gradient(135deg, #2d6cdf, #3ddc84)",
    boxShadow: "0 0 0 4px rgba(45,108,223,.16)",
  },
  brandName: { fontWeight: 800, opacity: 0.95, letterSpacing: 0.2 },

  heroTitle: { fontSize: 34, lineHeight: 1.1, margin: "8px 0 0", fontWeight: 900 },
  heroSub: { marginTop: 10, fontSize: 14, opacity: 0.82, lineHeight: 1.5, maxWidth: 540 },

  bullets: { marginTop: 18, display: "grid", gap: 10, fontSize: 13, opacity: 0.92 },
  bullet: { display: "flex", alignItems: "center", gap: 10 },
  bulletDot: { width: 8, height: 8, borderRadius: 999, background: "rgba(255,255,255,.35)" },

  smallNote: { marginTop: 18, fontSize: 12, opacity: 0.65 },
  codeInline: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.05)",
  },

  right: { display: "grid", alignContent: "center", gap: 12 },
  card: {
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 18,
    padding: 20,
    background: "rgba(21,25,37,.88)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.50)",
  },
  cardHeader: { marginBottom: 14 },
  cardTitle: { fontSize: 18, fontWeight: 900 },
  cardSub: { fontSize: 12, opacity: 0.75, marginTop: 4 },

  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 12, opacity: 0.9 },

  // ✅ Fix alignment / “off to the side”
  input: {
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(15,17,21,.92)",
    color: "white",
    outline: "none",
    lineHeight: 1.2,
  },

  error: {
    boxSizing: "border-box",
    border: "1px solid rgba(255,92,122,.35)",
    background: "rgba(255,92,122,.10)",
    color: "#ff9fb1",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 12,
  },

  button: {
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    fontWeight: 800,
    color: "white",
  },
  buttonActive: {
    cursor: "pointer",
    background: "linear-gradient(135deg, rgba(45,108,223,.95), rgba(61,220,132,.75))",
  },
  buttonDisabled: {
    cursor: "not-allowed",
    background: "rgba(255,255,255,.06)",
    opacity: 0.75,
  },

  footerRow: { display: "flex", justifyContent: "center", gap: 8, marginTop: 2, fontSize: 12 },
  link: { color: "#9cc2ff", textDecoration: "none", fontWeight: 700 },

  rightNote: { textAlign: "center", fontSize: 11, opacity: 0.7 },
  codePill: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.05)",
  },
};
