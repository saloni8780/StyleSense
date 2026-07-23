import { useState, useEffect } from "react";
import { getSavedOutfits, deleteSavedOutfit } from "../api";

export default function SavedOutfits({ user }) {
  const [open,     setOpen]     = useState(false);
  const [outfits,  setOutfits]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      getSavedOutfits()
        .then(setOutfits)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, user]);

  const handleDelete = async (id) => {
    await deleteSavedOutfit(id);
    setOutfits(prev => prev.filter(o => o.id !== id));
    if (expanded === id) setExpanded(null);
  };

  if (!user) return null;

  return (
    <div className="card-paper" style={{ marginBottom: 28 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          width: "100%", textAlign: "left", padding: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Your saved outfits</h2>
        <span style={{ fontSize: 20, color: "var(--ink-soft)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 18 }}>
          {loading && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading…</p>}

          {!loading && outfits.length === 0 && (
            <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
              No saved outfits yet — style something and hit Save.
            </p>
          )}

          {outfits.map(o => (
            <div key={o.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 14 }}>

              {/* Clickable header row */}
              <div onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <strong style={{ fontSize: 15 }}>{o.occasion}</strong>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "var(--rose-deep)" }}>
                      ₹{o.budget}
                    </span>
                  </div>
                  {expanded !== o.id && (
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.4 }}>
                      {o.tips?.slice(0, 100)}…
                      <span style={{ color: "var(--rose-deep)", marginLeft: 6 }}>tap to expand</span>
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>{expanded === o.id ? "▲" : "▼"}</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(o.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", fontSize: 20, padding: "0 4px" }}
                  >×</button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === o.id && (
                <div style={{ marginTop: 14 }}>
                  <div style={{
                    background: "var(--paper-soft)", borderRadius: 6,
                    padding: "12px 16px", marginBottom: 14, border: "1px solid var(--line)"
                  }}>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                      letterSpacing: ".1em", textTransform: "uppercase",
                      color: "var(--rose-deep)", margin: "0 0 8px"
                    }}>Styling note</p>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65 }}>{o.tips}</p>
                  </div>

                  {o.products_json?.length > 0 && (
                    <div>
                      <p style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                        letterSpacing: ".1em", textTransform: "uppercase",
                        color: "var(--ink-soft)", margin: "0 0 10px"
                      }}>Shop these</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {o.products_json.slice(0, 4).map((p, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 14px", background: "var(--paper)",
                            borderRadius: 4, border: "1px solid var(--line)"
                          }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</span>
                              <span style={{ marginLeft: 8, fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: "var(--rose-deep)" }}>
                                {p.price}
                              </span>
                            </div>
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              style={{
                                fontFamily: "'IBM Plex Mono',monospace", fontSize: 11,
                                textDecoration: "none", border: "1px solid var(--line)",
                                borderRadius: 20, padding: "4px 10px",
                                color: "var(--ink)", background: "var(--paper-soft)"
                              }}>
                              {p.platform} ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p style={{ marginTop: 12, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: "var(--ink-soft)" }}>
                    Saved {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}