import { logout } from "../api";
import { useNavigate } from "react-router-dom";

const NAV = [
  {
    group: "Styling",
    items: [
      { id: "style",         icon: "✦", label: "Style Advisor",      locked: false },
      { id: "weather",       icon: "☁", label: "Weather Styling",     locked: false },
      { id: "ways",          icon: "◈", label: "Ways to Style",        locked: false },
      { id: "compatibility", icon: "◎", label: "Compatibility Score",  locked: false },
      { id: "lookbook",      icon: "⬡", label: "Lookbook Feedback",    locked: false },
    ],
  },
  {
    group: "My Wardrobe",
    items: [
      { id: "wardrobe",      icon: "◻", label: "My Wardrobe",         locked: true  },
      { id: "wardrobestyle", icon: "◈", label: "Style from Wardrobe", locked: true  },
      { id: "saved",         icon: "♡", label: "Saved Outfits",       locked: true  },
    ],
  },
];

export default function Sidebar({ active, setActive, user, isGuest }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("ss_guest");
    navigate("/");
  };

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: "var(--board)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      minHeight: "100vh",
      position: "sticky", top: 0, height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ color: "var(--rose)", fontSize: 18 }}>✦</span>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          color: "var(--paper)", fontSize: 18, fontWeight: 700,
        }}>StyleSense</span>
      </div>

      {/* User badge */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--rose-deep)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {user[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color: "var(--paper)", fontSize: 13, fontWeight: 600 }}>{user}</div>
              <div style={{
                color: "var(--gold)",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase"
              }}>Full access</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ink-soft)", fontSize: 16, flexShrink: 0,
            }}>
              ?
            </div>
            <div>
              <div style={{ color: "#C0B8CC", fontSize: 13 }}>Guest</div>
              <div style={{
                color: "var(--ink-soft)",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase"
              }}>Limited access</div>
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom: 4 }}>
            <div style={{
              padding: "10px 18px 6px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, letterSpacing: ".15em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)"
            }}>
              {group.group}
            </div>

            {group.items.map(item => {
              const isLocked = item.locked && !user;
              const isActive = active === item.id;

              return (
                <button key={item.id}
                  onClick={() => {
                    if (isLocked) {
                      navigate("/");
                    } else {
                      setActive(item.id);
                    }
                  }}
                  title={isLocked ? "Log in to unlock" : item.label}
                  style={{
                    width: "100%", border: "none", cursor: isLocked ? "not-allowed" : "pointer",
                    background: isActive ? "rgba(201,123,132,0.15)" : "none",
                    borderLeft: isActive ? "2px solid var(--rose)" : "2px solid transparent",
                    padding: "9px 18px",
                    display: "flex", alignItems: "center", gap: 10,
                    textAlign: "left",
                    opacity: isLocked ? 0.4 : 1,
                    transition: "all .15s ease",
                  }}>
                  <span style={{
                    color: isActive ? "var(--rose)" : "rgba(255,255,255,0.5)",
                    fontSize: 14, width: 16, textAlign: "center", flexShrink: 0,
                  }}>
                    {item.icon}
                  </span>
                  <span style={{
                    color: isActive ? "var(--paper)" : "#C0B8CC",
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                  {isLocked && (
                    <span style={{ fontSize: 10, color: "var(--gold)" }}>🔒</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {!user && (
          <button className="cta" onClick={() => navigate("/")}
            style={{ fontSize: 12, padding: "8px 14px", textAlign: "center" }}>
            Log in for full access
          </button>
        )}
        {user && (
          <button className="cta ghost" onClick={handleLogout}
            style={{ fontSize: 12, padding: "8px 14px", color: "var(--paper)", borderColor: "rgba(255,255,255,0.2)" }}>
            Log out
          </button>
        )}
      </div>
    </aside>
  );
}