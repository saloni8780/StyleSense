import { useState } from "react";
import { saveOutfit } from "../api";

export default function OutfitTagGrid({ result, formValues, user, onAuthRequired }) {
  const [imgError,  setImgError]  = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (!result) return null;

  const imgSrc = result.image_b64 && !imgError
    ? `data:image/jpeg;base64,${result.image_b64}`
    : null;

  const handleSave = async () => {
    if (!user) { onAuthRequired(); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await saveOutfit({
        occasion:      formValues?.occasion     || "",
        style_pref:    formValues?.stylePref    || "",
        budget:        formValues?.budget       || 0,
        notes:         formValues?.notes        || "",
        tips:          result.tips              || "",
        products_json: result.products          || [],
        image_url:     "",   // generated image is base64 only; no permanent URL unless Cloudinary is wired
      });
      setSaved(true);
    } catch (err) {
      setSaveError("Save failed — are you still logged in?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Styling note */}
      <div className="card-paper">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <h3 style={{
            margin: 0,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12, letterSpacing: ".1em", color: "var(--rose-deep)"
          }}>
            STYLING NOTE
          </h3>
          <button
            className={`cta${saved ? " ghost" : ""}`}
            onClick={handleSave}
            disabled={saving || saved}
            style={{ fontSize: 12, padding: "8px 16px" }}
          >
            {saved ? "✓ Saved" : saving ? "Saving…" : "Save outfit"}
          </button>
        </div>
        <p style={{ margin: "12px 0 0", lineHeight: 1.65 }}>{result.tips}</p>
        {saveError && (
          <p style={{ color: "var(--rose-deep)", fontSize: 12, margin: "8px 0 0" }}>{saveError}</p>
        )}
      </div>

      

      {/* Product cards */}
      <div className="tag-grid">
        {(result.products || []).map((p, i) => (
          <div className="tag" key={i}>
            <h4>{p.title}</h4>
            <span className="price">{p.price}</span>
            <p className="rationale">{p.platform}</p>
            <div className="shop-pills">
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                View on {p.platform}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
