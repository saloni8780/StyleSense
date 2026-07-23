import { useState } from "react";
import { getCompatibilityScore } from "../api";

const GRADE_COLOR = {
  A: { bg: "#EAF4EA", text: "#2D6A2D", border: "#B5D9B5" },
  B: { bg: "#EEF3FB", text: "#1A4A8A", border: "#B5CAE8" },
  C: { bg: "#FEF6EC", text: "#7A4A00", border: "#F0D9B5" },
  D: { bg: "#FEF0F0", text: "#8A1A1A", border: "#E8B5B5" },
  "?": { bg: "var(--paper-soft)", text: "var(--ink-soft)", border: "var(--line)" },
};

const SEASONS = ["Summer", "Monsoon", "Winter", "Spring / Autumn"];

function ScoreBar({ label, score, max, reason, tip }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "#2D6A2D" : pct >= 60 ? "#B8924F" : "#B05D68";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12, color,
          fontWeight: 700
        }}>
          {score}/{max}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6, background: "var(--line)",
        borderRadius: 3, overflow: "hidden", marginBottom: 6
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color, borderRadius: 3,
          transition: "width .6s ease"
        }} />
      </div>

      {/* Reason */}
      <p style={{ margin: "0 0 3px", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
        {reason}
      </p>

      {/* Tip */}
      {tip && (
        <p style={{
          margin: 0, fontSize: 11.5,
          fontFamily: "'IBM Plex Mono', monospace",
          color: "var(--gold)", lineHeight: 1.5
        }}>
          💡 {tip}
        </p>
      )}
    </div>
  );
}

export default function CompatibilityScore() {
  const [outfit,   setOutfit]   = useState("");
  const [occasion, setOccasion] = useState("");
  const [season,   setSeason]   = useState("Summer");
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outfit.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await getCompatibilityScore({ outfit, occasion, season, notes }));
    } catch {
      setError("Couldn't score the outfit — try again.");
    } finally {
      setLoading(false);
    }
  };

  const grade = result?.grade || "?";
  const gradeStyle = GRADE_COLOR[grade] || GRADE_COLOR["?"];

  return (
    <div className="card-paper" style={{ marginBottom: 28 }}>
      <h2 style={{ margin: "0 0 4px" }}>Outfit Compatibility Score</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 20px" }}>
        Describe your outfit — get a score across colour, occasion, formality, accessories and season with reasons for every point.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Describe your outfit *</label>
          <textarea
            value={outfit}
            onChange={e => setOutfit(e.target.value)}
            placeholder="e.g. Navy blue midi dress with white sneakers, silver hoop earrings, and a white tote bag"
            rows={3}
            required
            style={{
              width: "100%", border: "1px solid var(--line)",
              background: "var(--paper-soft)", borderRadius: 4,
              padding: "11px 12px", fontFamily: "'Manrope', sans-serif",
              fontSize: 15, color: "var(--ink)", resize: "vertical"
            }}
          />
        </div>

        <div className="row2">
          <div className="field">
            <label>Occasion</label>
            <input
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              placeholder="e.g. birthday dinner, office, college"
            />
          </div>
          <div className="field">
            <label>Season</label>
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              style={{
                width: "100%", border: "1px solid var(--line)",
                background: "var(--paper-soft)", borderRadius: 4,
                padding: "11px 12px", fontFamily: "'Manrope', sans-serif",
                fontSize: 15, color: "var(--ink)"
              }}
            >
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Extra context (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. outdoor event, warm skin tone, Indo-western vibe"
          />
        </div>

        <button className="cta" type="submit" disabled={loading}>
          {loading ? "Scoring your outfit…" : "Score this outfit"}
        </button>
      </form>

      {error && <p style={{ color: "var(--rose-deep)", marginTop: 12, fontSize: 13 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 24 }}>

          {/* Overall score card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            padding: "20px 22px", borderRadius: 8, marginBottom: 24,
            background: gradeStyle.bg,
            border: `1px solid ${gradeStyle.border}`,
          }}>
            {/* Grade circle */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: gradeStyle.text,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700 }}>
                {grade}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: gradeStyle.text, lineHeight: 1 }}>
                  {result.overall}
                </span>
                <span style={{ fontSize: 16, color: gradeStyle.text, opacity: 0.7 }}>/100</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: gradeStyle.text, lineHeight: 1.4 }}>
                {result.headline}
              </p>
            </div>
          </div>

          {/* Dimension scores */}
          <div style={{
            background: "var(--paper-soft)", borderRadius: 6,
            padding: "18px 20px", marginBottom: 18,
            border: "1px solid var(--line)"
          }}>
            {(result.dimensions || []).map(d => (
              <ScoreBar key={d.key} {...d} />
            ))}
          </div>

          {/* Fix */}
          {result.fix && (
            <div style={{
              background: "#FEF6EC", borderRadius: 6,
              padding: "14px 18px",
              border: "1px solid #F0D9B5"
            }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11, textTransform: "uppercase",
                letterSpacing: ".1em", color: "var(--gold)",
                margin: "0 0 6px"
              }}>
                Biggest improvement
              </p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{result.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
