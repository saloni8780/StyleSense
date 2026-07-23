import { useState } from "react";
import { getWeatherStyle } from "../api";

const WEATHER_ICON = {
  sunny:   "☀️", clear: "☀️", bright: "🌤️",
  cloudy:  "☁️", overcast: "☁️",
  rain:    "🌧️", drizzle: "🌦️", shower: "🌧️", thunder: "⛈️",
  mist:    "🌫️", fog: "🌫️", haze: "🌫️",
  snow:    "❄️",
};

function getWeatherIcon(desc = "") {
  const d = desc.toLowerCase();
  for (const [key, icon] of Object.entries(WEATHER_ICON)) {
    if (d.includes(key)) return icon;
  }
  return "🌡️";
}

function TempBadge({ temp }) {
  const color = temp >= 35 ? "#C0392B"
    : temp >= 28 ? "#E67E22"
    : temp >= 20 ? "#27AE60"
    : temp >= 12 ? "#2980B9"
    : "#8E44AD";
  return (
    <span style={{
      background: color + "20", color,
      borderRadius: 20, padding: "3px 12px",
      fontSize: 13, fontWeight: 600,
      border: `1px solid ${color}40`
    }}>
      {temp}°C
    </span>
  );
}

export default function WeatherStyle() {
  const [city,      setCity]      = useState("");
  const [occasion,  setOccasion]  = useState("");
  const [stylePref, setStylePref] = useState("frocks");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getWeatherStyle({ city, occasion, stylePref });
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message || "Couldn't fetch weather — check the city name.");
    } finally {
      setLoading(false);
    }
  };

  const w = result?.weather;
  const a = result?.advice;

  return (
    <div className="card-paper" style={{ marginBottom: 28 }}>
      <h2 style={{ margin: "0 0 4px" }}>Weather-aware styling</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 20px" }}>
        Enter your city — outfit suggestions adjust to today's real weather.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="row2">
          <div className="field">
            <label>Your city</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Mumbai, Bangalore, Delhi"
              required
            />
          </div>
          <div className="field">
            <label>Occasion (optional)</label>
            <input
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              placeholder="e.g. office, college, date"
            />
          </div>
        </div>

        <div className="field">
          <label>Style preference</label>
          <input
            value={stylePref}
            onChange={e => setStylePref(e.target.value)}
            placeholder="e.g. frocks, kurta, jeans"
          />
        </div>

        <button className="cta" type="submit" disabled={loading}>
          {loading ? "Checking weather…" : "Get weather outfit advice"}
        </button>
      </form>

      {error && (
        <p style={{ color: "var(--rose-deep)", marginTop: 12, fontSize: 13 }}>{error}</p>
      )}

      {result && w && a && (
        <div style={{ marginTop: 22 }}>

          {/* Weather card */}
          <div style={{
            background: "var(--paper-soft)",
            border: "1px solid var(--line)",
            borderRadius: 8, padding: "16px 18px",
            marginBottom: 20,
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 36 }}>{getWeatherIcon(w.desc)}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{w.city}</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{w.desc}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <TempBadge temp={w.temp_c} />
              <span style={{
                background: "var(--paper)", border: "1px solid var(--line)",
                borderRadius: 20, padding: "3px 12px", fontSize: 13
              }}>
                Feels {w.feels_like}°C
              </span>
              <span style={{
                background: "var(--paper)", border: "1px solid var(--line)",
                borderRadius: 20, padding: "3px 12px", fontSize: 13
              }}>
                💧 {w.humidity}%
              </span>
              <span style={{
                background: "var(--paper)", border: "1px solid var(--line)",
                borderRadius: 20, padding: "3px 12px", fontSize: 13
              }}>
                🌬 {w.wind_kmph} km/h
              </span>
            </div>
          </div>

          {/* Weather line */}
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13, color: "var(--rose-deep)",
            marginBottom: 18, lineHeight: 1.5
          }}>
            {a.weather_line}
          </p>

          {/* Outfit cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            {(a.outfits || []).map((o, i) => (
              <div key={i} style={{
                border: "1px solid var(--line)", borderRadius: 6,
                padding: "14px 16px", background: "var(--paper)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>{o.name}</strong>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10, color: "var(--ink-soft)",
                    background: "var(--paper-soft)",
                    borderRadius: 20, padding: "2px 8px",
                    border: "1px solid var(--line)"
                  }}>
                    look {i + 1}
                  </span>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.55 }}>{o.description}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic" }}>
                  {o.why}
                </p>
              </div>
            ))}
          </div>

          {/* Avoid section */}
          <div style={{
            background: "#FEF6EC",
            border: "1px solid #F0D9B5",
            borderRadius: 6, padding: "12px 16px"
          }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, textTransform: "uppercase",
              letterSpacing: ".08em", color: "var(--gold)",
              margin: "0 0 6px"
            }}>
              Avoid today
            </p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{a.avoid}</p>
          </div>

        </div>
      )}
    </div>
  );
}
