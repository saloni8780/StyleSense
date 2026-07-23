/**
 * WardrobeStyleResult.jsx
 * Displays outfit combinations built from the user's wardrobe.
 * Shows what they own vs what they might need to buy.
 */
import { useState } from "react";
import { getWardrobe, getWardrobeStyle } from "../api";

const CONFIDENCE_COLOR = {
  High:   "var(--rose-deep)",
  Medium: "var(--gold)",
  Low:    "var(--ink-soft)",
};

export default function WardrobeStyleResult({ user, onAuthRequired }) {
  const [occasion,  setOccasion]  = useState("");
  const [notes,     setNotes]     = useState("");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch wardrobe first, then send to AI
      const wardrobeItems = await getWardrobe();
      const data = await getWardrobeStyle({ occasion, budget: 0, notes, wardrobe_items: wardrobeItems });
      setResult(data);
    } catch (err) {
      setError("Couldn't build outfits from your wardrobe — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-paper" style={{ marginBottom: 28 }}>
      <h2 style={{ margin: "0 0 4px" }}>Style from my wardrobe</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 20px" }}>
        AI builds outfits from what you own first — only suggests buying what's missing.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Occasion</label>
          <input
            value={occasion}
            onChange={e => setOccasion(e.target.value)}
            placeholder="e.g. Birthday dinner, office meeting, college fest"
            required
          />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. outdoor event, evening" />
        </div>

        <button className="cta" type="submit" disabled={loading || !user}>
          {!user ? "Log in to use this" : loading ? "Checking your wardrobe…" : "Find outfits from my wardrobe"}
        </button>
      </form>

      {error && <p style={{ color: "var(--rose-deep)", marginTop: 12, fontSize: 13 }}>{error}</p>}

      {/* Results */}
      {result && (
        <div style={{ marginTop: 24 }}>
          {/* Tips */}
          <div style={{
            background: "var(--paper-soft)", borderRadius: 6,
            padding: "14px 18px", marginBottom: 20,
            border: "1px solid var(--line)"
          }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: ".12em", textTransform: "uppercase",
              color: "var(--rose-deep)", margin: "0 0 8px"
            }}>Styling advice</p>
            <p style={{ margin: 0, lineHeight: 1.65, fontSize: 14 }}>{result.tips}</p>
          </div>

          {/* Wardrobe not sufficient notice */}
          {result.wardrobe_sufficient === false && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
              color: "var(--gold)", marginBottom: 16
            }}>
              ⚠ Your wardrobe doesn't have enough for this occasion — showing what to buy instead.
            </p>
          )}

          {/* Outfit cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(result.outfits || []).map((outfit, i) => (
              <div key={i} style={{
                border: "1px solid var(--line)", borderRadius: 6,
                padding: "18px 20px", background: "var(--paper)"
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: 18 }}>
                    {outfit.name}
                  </h3>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                    color: CONFIDENCE_COLOR[outfit.confidence] || "var(--ink-soft)",
                    border: `1px solid ${CONFIDENCE_COLOR[outfit.confidence] || "var(--line)"}`,
                    borderRadius: 20, padding: "3px 10px"
                  }}>
                    {outfit.confidence} match
                  </span>
                </div>

                {/* Why it works */}
                <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 14px", lineHeight: 1.5 }}>
                  {outfit.reason}
                </p>

                {/* Items from wardrobe */}
                {outfit.items_used?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: ".08em",
                      color: "var(--ink-soft)", margin: "0 0 8px"
                    }}>From your wardrobe ✓</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {outfit.items_used.map((item, j) => (
                        <span key={j} style={{
                          background: "#EAF4EA", color: "#2D6A2D",
                          borderRadius: 20, padding: "4px 12px",
                          fontSize: 13, fontWeight: 500
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing piece */}
                {outfit.missing && (
                  <div style={{
                    background: "#FEF6EC", borderRadius: 6,
                    padding: "10px 14px",
                    border: "1px solid #F0D9B5"
                  }}>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: ".08em",
                      color: "var(--gold)", margin: "0 0 6px"
                    }}>Missing piece</p>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{outfit.missing}</p>

                    {outfit.buy_suggestion && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        {["Amazon", "Flipkart", "Myntra", "Ajio"].map(site => {
                          const q = encodeURIComponent(outfit.buy_suggestion);
                          const urls = {
                            Amazon:   `https://www.amazon.in/s?k=${q}`,
                            Flipkart: `https://www.flipkart.com/search?q=${q}`,
                            Myntra:   `https://www.myntra.com/${outfit.buy_suggestion.replace(/ /g, "-")}`,
                            Ajio:     `https://www.ajio.com/search/?text=${q}`,
                          };
                          return (
                            <a key={site} href={urls[site]} target="_blank" rel="noopener noreferrer"
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                                textDecoration: "none", border: "1px solid var(--line)",
                                borderRadius: 20, padding: "5px 12px",
                                color: "var(--ink)", background: "var(--paper)"
                              }}>
                              Shop {site}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}