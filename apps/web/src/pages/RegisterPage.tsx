import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setToken } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await register(usernameOrEmail.trim(), password);

      // auto-login after register
      const res = await login(usernameOrEmail.trim(), password);
      setToken(res.access_token);

      navigate("/app", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Register</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email or Username
          <input
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="username"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="new-password"
          />
        </label>

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
