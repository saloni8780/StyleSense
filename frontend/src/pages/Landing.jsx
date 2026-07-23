import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api";

function TypewriterQuotes() {
  const quotes = [
    "Style, refined.",
    "Elegance in every detail.",
    "A quieter kind of luxury.",
    "Dress with intention.",
    "Let your wardrobe speak.",
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentQuote = quotes[quoteIndex];

    let timer;

    if (!isDeleting && text.length < currentQuote.length) {
      timer = setTimeout(() => {
        setText(currentQuote.slice(0, text.length + 1));
      }, 45);
    } else if (!isDeleting && text.length === currentQuote.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && text.length > 0) {
      timer = setTimeout(() => {
        setText(currentQuote.slice(0, text.length - 1));
      }, 35);
    } else {
      setIsDeleting(false);
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, quoteIndex]);

  return (
    <p
      style={{
        color: "#F3E7D5",
        fontSize: 18,
        lineHeight: 1.75,
        margin: "0 0 36px",
        maxWidth: 520,
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        opacity: 0.95,
        minHeight: "34px",
      }}
    >
      {text}
      <span
        style={{
          display: "inline-block",
          width: "2px",
          height: "1em",
          background: "#F3E7D5",
          marginLeft: "4px",
          animation: "blink 0.8s infinite",
          verticalAlign: "middle",
        }}
      />
    </p>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (tab === "login") {
        await login(username, password);
      } else {
        await register(username, email, password);
      }

      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    localStorage.setItem("ss_guest", "true");
    navigate("/app");
  };

  const FEATURES = [
    { icon: "✦", label: "Style Advisor", locked: false },
    { icon: "☁", label: "Weather Styling", locked: false },
    { icon: "◈", label: "Ways to Style", locked: false },
    { icon: "◎", label: "Compatibility Score", locked: false },
    { icon: "⬡", label: "Lookbook Feedback", locked: false },
    { icon: "◻", label: "My Wardrobe", locked: true },
    { icon: "◈", label: "Wardrobe Style", locked: true },
    { icon: "♡", label: "Saved Outfits", locked: true },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--board)",
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, var(--board-soft) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, var(--board-soft) 0%, transparent 55%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--rose)", fontSize: 20 }}>✦</span>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "var(--paper)",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            StyleSense
          </span>
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          AI Fashion Stylist
        </div>
      </nav>

      <div
        className="landing-grid"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 40px",
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* Left Side */}
        <div style={{ paddingRight: 60 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "var(--rose)",
              marginBottom: 18,
            }}
          >
            Personal AI Stylist · India Edition
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "var(--paper)",
              fontSize: "clamp(42px,5vw,66px)",
              lineHeight: 1.05,
              marginBottom: 22,
            }}
          >
            Your wardrobe,
            <br />
            <em style={{ color: "var(--rose)" }}>understood.</em>
          </h1>

          {/* Typewriter */}
          <TypewriterQuotes />

          {/* Features */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 20px",
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: f.locked ? 0.45 : 1,
                }}
              >
                <span style={{ color: "var(--rose)" }}>{f.icon}</span>

                <span style={{ color: "var(--paper)", fontSize: 13.5 }}>
                  {f.label}
                </span>

                {f.locked && (
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: "var(--gold)",
                      border: "1px solid var(--gold)",
                      borderRadius: 20,
                      padding: "1px 6px",
                    }}
                  >
                    LOGIN
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Auth Card */}
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,239,228,.94))",
            borderRadius: 18,
            padding: 32,
            boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--line)",
              marginBottom: 24,
            }}
          >
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 10,
                  fontWeight: 700,
                  color:
                    tab === t ? "var(--rose-deep)" : "var(--ink-soft)",
                  borderBottom:
                    tab === t
                      ? "2px solid var(--rose-deep)"
                      : "2px solid transparent",
                }}
              >
                {t === "login" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div className="field">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {tab === "register" && (
              <div className="field">
                <label>Email (optional)</label>
                <input
                  value={email}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label>Password</label>
              <input
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>
            )}

            <button
              className="cta"
              type="submit"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading
                ? "..."
                : tab === "login"
                ? "Log in"
                : "Create account"}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "18px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#ddd" }} />
            <span>or</span>
            <div style={{ flex: 1, height: 1, background: "#ddd" }} />
          </div>

          <button
            className="cta ghost"
            onClick={handleGuest}
            style={{ width: "100%" }}
          >
            Continue as guest
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%,50% { opacity:1; }
          51%,100% { opacity:0; }
        }

        @media (max-width:700px){
          .landing-grid{
            grid-template-columns:1fr !important;
            padding:32px 20px !important;
          }

          .landing-grid > div:first-child{
            padding-right:0 !important;
            margin-bottom:32px;
          }
        }
      `}</style>
    </div>
  );
}