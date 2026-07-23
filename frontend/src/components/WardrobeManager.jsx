/**
 * WardrobeManager.jsx
 * Add, view, and delete wardrobe items.
 * Items are stored in Django → PostgreSQL.
 * Image upload goes to Cloudinary via the image_url field.
 */
import { useState, useEffect } from "react";
import { getWardrobe, addWardrobeItem, deleteWardrobeItem } from "../api";

const CATEGORIES = [
  { value: "top",       label: "Top / Shirt / Blouse" },
  { value: "bottom",    label: "Bottom / Pants / Skirt" },
  { value: "dress",     label: "Dress / Frock" },
  { value: "outerwear", label: "Jacket / Blazer / Coat" },
  { value: "footwear",  label: "Shoes / Sandals / Heels" },
  { value: "accessory", label: "Jewellery / Belt / Bag" },
  { value: "ethnic",    label: "Ethnic / Saree / Kurta" },
  { value: "other",     label: "Other" },
];

const CATEGORY_EMOJI = {
  top: "👕", bottom: "👖", dress: "👗", outerwear: "🧥",
  footwear: "👟", accessory: "💍", ethnic: "🥻", other: "🎽"
};

export default function WardrobeManager({ user, onAuthRequired }) {
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({
    name: "", category: "dress", color: "", occasion: "", notes: ""
  });

  useEffect(() => {
    if (open && user) fetchItems();
  }, [open, user]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getWardrobe();
      setItems(data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    setAdding(true);
    try {
      const newItem = await addWardrobeItem(form);
      setItems(prev => [newItem, ...prev]);
      setForm({ name: "", category: "dress", color: "", occasion: "", notes: "" });
    } catch {}
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    await deleteWardrobeItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Group items by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat.value);
    if (catItems.length) acc[cat.value] = catItems;
    return acc;
  }, {});

  return (
    <div className="card-paper" style={{ marginBottom: 28 }}>
      {/* Header */}
      <button onClick={() => { if (!user) { onAuthRequired(); return; } setOpen(o => !o); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          width: "100%", textAlign: "left", padding: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>My Wardrobe</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-soft)" }}>
            {user ? `${items.length} items · outfit suggestions from your closet first` : "Log in to manage your wardrobe"}
          </p>
        </div>
        <span style={{ fontSize: 20, color: "var(--ink-soft)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && user && (
        <div style={{ marginTop: 20 }}>

          {/* Add item form */}
          <form onSubmit={handleAdd} style={{
            background: "var(--paper-soft)", borderRadius: 6,
            padding: 18, marginBottom: 22,
            border: "1px solid var(--line)"
          }}>
            <p style={{
              margin: "0 0 14px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, letterSpacing: ".12em",
              textTransform: "uppercase", color: "var(--rose-deep)"
            }}>Add item to wardrobe</p>

            <div className="row2">
              <div className="field">
                <label>Item name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. White cotton shirt"
                  required
                />
              </div>
              <div className="field">
                <label>Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{
                    width: "100%", border: "1px solid var(--line)",
                    background: "var(--paper-soft)", borderRadius: 4,
                    padding: "11px 12px", fontFamily: "'Manrope', sans-serif",
                    fontSize: 15, color: "var(--ink)"
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row2">
              <div className="field">
                <label>Colour</label>
                <input
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="e.g. Navy blue"
                />
              </div>
              <div className="field">
                <label>Best for occasion</label>
                <input
                  value={form.occasion}
                  onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}
                  placeholder="e.g. Casual, Office, Party"
                />
              </div>
            </div>

            <button className="cta" type="submit" disabled={adding}
              style={{ fontSize: 13, padding: "10px 20px" }}>
              {adding ? "Adding…" : "+ Add to wardrobe"}
            </button>
          </form>

          {/* Loading */}
          {loading && (
            <p style={{ color: "var(--ink-soft)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
              Loading wardrobe…
            </p>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <p style={{ color: "var(--ink-soft)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              Your wardrobe is empty — add your first item above.
            </p>
          )}

          {/* Grouped items */}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 18 }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                letterSpacing: ".1em", textTransform: "uppercase",
                color: "var(--ink-soft)", margin: "0 0 10px"
              }}>
                {CATEGORY_EMOJI[cat]} {CATEGORIES.find(c => c.value === cat)?.label}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {catItems.map(item => (
                  <div key={item.id} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "10px 14px",
                    background: "var(--paper)", borderRadius: 4,
                    border: "1px solid var(--line)"
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                      {item.color && (
                        <span style={{
                          marginLeft: 10, fontSize: 12,
                          color: "var(--ink-soft)"
                        }}>
                          · {item.color}
                        </span>
                      )}
                      {item.occasion && (
                        <span style={{
                          marginLeft: 10, fontSize: 11,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: "var(--rose-deep)"
                        }}>
                          {item.occasion}
                        </span>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--ink-soft)", fontSize: 18, lineHeight: 1,
                        padding: "2px 6px"
                      }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
