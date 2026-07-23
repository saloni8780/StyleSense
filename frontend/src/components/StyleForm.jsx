import { useState } from "react";

export default function StyleForm({ onSubmit, loading }) {
  const [occasion, setOccasion] = useState("Birthday dinner");
  const [stylePref, setStylePref] = useState("Frocks / dresses");
  const [budget, setBudget] = useState(2500);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ occasion, stylePref, budget: Number(budget), notes });
  };

  return (
    <form className="card-paper" onSubmit={handleSubmit}>
      <h2>What's the occasion?</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 0 }}>
        Frocks are the default if you don't change it. Budget is in ₹.
      </p>

      <div className="field">
        <label htmlFor="occasion">Occasion</label>
        <input id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="style">Style preference</label>
          <input id="style" value={stylePref} onChange={(e) => setStylePref(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="budget">Budget (₹)</label>
          <input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Anything else? (colours, skin tone, event details — optional)</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <button className="cta" type="submit" disabled={loading}>
        {loading ? "Consulting the racks…" : "Style it for me"}
      </button>
    </form>
  );
}
