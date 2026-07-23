import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../api";

import Sidebar          from "../components/Sidebar.jsx";
import StyleForm        from "../components/StyleForm.jsx";
import OutfitTagGrid    from "../components/OutfitTagGrid.jsx";
import WeatherStyle     from "../components/WeatherStyle.jsx";
import StyleGrid        from "../components/StyleGrid.jsx";
import CompatibilityScore from "../components/CompatibilityScore.jsx";
import Lookbook         from "../components/Lookbook.jsx";
import WardrobeManager  from "../components/WardrobeManager.jsx";
import WardrobeStyleResult from "../components/WardrobeStyleResult.jsx";
import SavedOutfits     from "../components/SavedOutfits.jsx";
import StylistChat from "../components/StylistChat.jsx";
import { getStyling }   from "../api";

const STEPS = [
  "Checking the knowledge base…",
  "Writing your styling note…",
  "Searching Flipkart & Amazon…",
  "Putting it all together…",
];

const PAGE_TITLES = {
  style:         { title: "Style Advisor",       subtitle: "Tell me the occasion and budget — I'll style it for you." },
  chat:          { title: "AI Stylist Chat",     subtitle: "Chat with your stylist — ask anything, follow up, get styled." },
  weather:       { title: "Weather Styling",      subtitle: "Real weather for your city, outfit advice that actually makes sense." },
  ways:          { title: "Ways to Style",         subtitle: "Enter clothes you own — get AI-generated outfit variations." },
  compatibility: { title: "Compatibility Score",  subtitle: "Describe your outfit — get a score across 5 dimensions with explanations." },
  lookbook:      { title: "Lookbook Feedback",    subtitle: "Upload outfit photos — AI checks coordination." },
  wardrobe:      { title: "My Wardrobe",          subtitle: "Your closet, remembered. Add items once, reference them forever." },
  wardrobestyle: { title: "Style from Wardrobe",  subtitle: "AI builds outfits from what you own first." },
  saved:         { title: "Saved Outfits",        subtitle: "Outfits you've saved, with shop links and styling notes." },
};

export default function Dashboard() {
  const navigate  = useNavigate();
  const user      = getStoredUser();
  const isGuest   = !user && localStorage.getItem("ss_guest") === "true";

  // Redirect if not auth'd at all
  if (!user && !isGuest) {
    navigate("/");
    return null;
  }

  const [active,     setActive]     = useState("style");
  const [result,     setResult]     = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState(0);
  const [error,      setError]      = useState(null);

  const handleStyle = async (values) => {
    setLoading(true);
    setResult(null);
    setFormValues(values);
    setError(null);
    setStep(0);
    const interval = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 3000);
    try {
      const data = await getStyling(values);
      setResult(data);
    } catch {
      setError("Couldn't put the look together — try again in a moment.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setStep(0);
    }
  };

  const { title, subtitle } = PAGE_TITLES[active] || {};

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #f5ebdf 0%, #efe3d1 100%)" }}>
      <Sidebar active={active} setActive={setActive} user={user} isGuest={isGuest} />

      {/* Main content */}
      <main style={{
        flex: 1, overflowY: "auto",
        background: "transparent",
      }}>
        {/* Page header */}
        <div style={{
          padding: "28px 36px 0",
          borderBottom: "1px solid rgba(42,35,48,0.1)",
          background: "rgba(255,255,255,0.68)",
          backdropFilter: "blur(10px)",
          marginBottom: 28,
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontSize: 32, fontWeight: 700,
            color: "var(--ink)", margin: "0 0 4px",
            letterSpacing: "0.01em",
          }}>{title}</h1>
          <p style={{
            color: "var(--ink-soft)", fontSize: 14,
            margin: "0 0 20px", lineHeight: 1.5,
          }}>{subtitle}</p>
        </div>

        {/* Page content */}
        <div style={{ padding: "0 36px 48px", maxWidth: 860, width: "100%" }}>

          {active === "style" && (
            <>
              <StyleForm onSubmit={handleStyle} loading={loading} />
              {loading && (
                <div className="card-paper" style={{ textAlign: "center", padding: "22px 26px", marginBottom: 28 }}>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13, color: "var(--gold)", marginBottom: 14
                  }}>
                    {STEPS[step]}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    {STEPS.map((_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: i <= step ? "var(--rose-deep)" : "var(--line)",
                        transition: "background .4s ease"
                      }} />
                    ))}
                  </div>
                </div>
              )}
              {error && <p style={{ color: "var(--rose-deep)" }}>{error}</p>}
              <OutfitTagGrid
                result={result}
                formValues={formValues}
                user={user}
                onAuthRequired={() => navigate("/")}
              />
            </>
          )}

          {active === "weather"       && <WeatherStyle />}
          {active === "chat"          && <StylistChat />}
          {active === "ways"          && <StyleGrid />}
          {active === "compatibility" && <CompatibilityScore />}
          {active === "lookbook"      && <Lookbook />}
          {active === "wardrobe"      && <WardrobeManager user={user} onAuthRequired={() => navigate("/")} />}
          {active === "wardrobestyle" && <WardrobeStyleResult user={user} onAuthRequired={() => navigate("/")} />}
          {active === "saved"         && <SavedOutfits user={user} />}

        </div>
      </main>
    </div>
  );
}
