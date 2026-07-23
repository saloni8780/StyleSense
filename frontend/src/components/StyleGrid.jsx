/**
 * StyleGrid.jsx
 * "N ways to style" feature — generates multiple outfit variation images
 * for items the user already owns, like the Pinterest/Instagram format.
 */
import { useState } from "react";
import { getStyleGrid } from "../api";

export default function StyleGrid() {
  const [items,   setItems]   = useState("");
  const [count,   setCount]   = useState(3);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error,   setError]   = useState(null);
  const [step,    setStep]    = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.trim()) return;
    setLoading(true);
    setResults([]);
    setError(null);
    setStep(0);

    // Progress steps — each image takes ~10s on HF free tier
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, 3));
    }, 8000);

    try {
      const data = await getStyleGrid({ items, count });
      setResults(data.variations || []);
    } catch {
      setError("Couldn't generate the style grid — try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const STEPS = [
    "Loading outfit variations…",
    "Generating look 1…",
    "Generating look 2…",
    "Generating look 3…",
  ];

  return (
    <div className="card-paper" style={{ marginBottom: 28 }}>
      {/* Header */}
      <h2 style={{ margin: "0 0 4px" }}>Ways to style it</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 20px" }}>
        Enter clothes you own — get 3 AI-generated outfit variations like the
        "5 ways to style" format you see on Instagram.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Your clothing items</label>
          <input
            value={items}
            onChange={e => setItems(e.target.value)}
            placeholder="e.g. black flared jeans, dark blue denim jacket"
            required
          />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>How many variations?</label>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 4,
                  border: "1.5px solid",
                  borderColor: count === n ? "var(--ink)" : "var(--line)",
                  background: count === n ? "var(--ink)" : "var(--paper-soft)",
                  color: count === n ? "var(--paper)" : "var(--ink)",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all .15s ease",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button className="cta" type="submit" disabled={loading}>
          {loading ? STEPS[step] : "Generate style variations"}
        </button>
      </form>

      {/* Loading bar */}
      {loading && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= step ? "var(--rose-deep)" : "var(--line)",
                transition: "background .5s ease"
              }} />
            ))}
          </div>
          <p style={{
            fontSize: 12, color: "var(--ink-soft)",
            fontFamily: "'IBM Plex Mono', monospace", margin: 0
          }}>
            Images generate in parallel — usually done in ~15s total — generating {step}/3
          </p>
        </div>
      )}

      {error && <p style={{ color: "var(--rose-deep)", marginTop: 12, fontSize: 13 }}>{error}</p>}

      {/* Results grid */}
      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: ".12em", textTransform: "uppercase",
            color: "var(--rose-deep)", margin: "0 0 16px"
          }}>
            {results.length} ways to style · {items}
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${results.length}, 1fr)`,
            gap: 12,
          }}>
            {results.map((v, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                {/* Label badge */}
                <div style={{
                  background: "var(--ink)", color: "var(--paper)",
                  fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: ".08em", textTransform: "uppercase",
                  padding: "4px 8px", borderRadius: "4px 4px 0 0",
                  marginBottom: 0
                }}>
                  {i + 1}. {v.label}
                </div>

                {/* Image */}
                {v.image_b64 ? (
                  <img
                    src={`data:image/jpeg;base64,${v.image_b64}`}
                    alt={v.label}
                    style={{
                      width: "100%",
                      aspectRatio: "3/4",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: "0 0 4px 4px"
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%", aspectRatio: "3/4",
                    background: "var(--paper-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "0 0 4px 4px",
                    border: "1px solid var(--line)"
                  }}>
                    <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      Image unavailable
                    </span>
                  </div>
                )}

                {/* Details below image */}
                <div style={{
                  marginTop: 8, textAlign: "left",
                  padding: "0 2px"
                }}>
                  <p style={{
                    margin: "0 0 3px", fontSize: 12, fontWeight: 600,
                    color: "var(--ink)"
                  }}>
                    {v.top}
                  </p>
                  <p style={{
                    margin: 0, fontSize: 11,
                    color: "var(--ink-soft)", lineHeight: 1.4
                  }}>
                    {v.accessories}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic tip based on items */}
          <p style={{
            marginTop: 18, fontSize: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            color: "var(--ink-soft)", textAlign: "center",
            borderTop: "1px solid var(--line)", paddingTop: 14
          }}>
            {items.toLowerCase().includes("flare") || items.toLowerCase().includes("wide")
              ? "TIPS: Keep proportions balanced · Wide-leg styles look best with fitted or cropped tops"
              : items.toLowerCase().includes("saree") || items.toLowerCase().includes("sari")
              ? "TIPS: Drape the pallu neatly · Let the blouse do the styling work"
              : items.toLowerCase().includes("kurta") || items.toLowerCase().includes("ethnic")
              ? "TIPS: Layer with a dupatta or jacket · Kolhapuri or juttis work best"
              : items.toLowerCase().includes("dress") || items.toLowerCase().includes("frock")
              ? "TIPS: Let the dress be the statement · Keep accessories minimal"
              : items.toLowerCase().includes("jacket") || items.toLowerCase().includes("blazer")
              ? "TIPS: Structure on top means keep bottoms simple · Tuck in your top"
              : "TIPS: Pick one statement piece · Let everything else stay minimal"}
          </p>
        </div>
      )}
    </div>
  );
}
