/**
 * AuthModal.jsx
 * A slide-up modal with two tabs: Login and Register.
 * Uses inline state — no external auth library needed.
 * Token is stored in localStorage by api.js on success.
 */
import { useState } from "react";
import { login, register } from "../api";

export default function AuthModal({ onClose, onSuccess }) {
  const [tab,      setTab]      = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === "login") {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(36,27,46,.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 16,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--paper)", borderRadius: 8,
        padding: 28, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 60px -20px rgba(0,0,0,.6)"
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--line)" }}>
          {["login", "register"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(null); }}
              style={{
                flex: 1, border: "none", background: "none", cursor: "pointer",
                padding: "10px 0", fontFamily: "'Manrope', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: ".04em",
                textTransform: "capitalize",
                color: tab === t ? "var(--rose-deep)" : "var(--ink-soft)",
                borderBottom: tab === t ? "2px solid var(--rose-deep)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>

          {tab === "register" && (
            <div className="field">
              <label>Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && (
            <p style={{ color: "var(--rose-deep)", fontSize: 13, margin: "0 0 14px" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button className="cta" type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? "…" : tab === "login" ? "Log in" : "Create account"}
            </button>
            <button className="cta ghost" type="button" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
