import { useState } from "react";
import { getLookbookFeedback } from "../api";

export default function Lookbook() {
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error,    setError]    = useState(null);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, 4 - files.length);
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const checkCoordination = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await getLookbookFeedback(files, "");
      setFeedback(result);
    } catch {
      setError("Couldn't read the pieces — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-paper">
      <h2>Already have the pieces?</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 0 }}>
        Upload outfit, shoes, and jewellery photos — AI checks if they
        work together and tells you exactly what to change.
      </p>

      {/* Upload trigger */}
      <div
        onClick={() => !loading && document.getElementById("lbFileInput").click()}
        style={{
          border: "1.5px dashed var(--line)", borderRadius: 5,
          padding: 22, textAlign: "center", cursor: loading ? "default" : "pointer",
          background: "var(--paper-soft)", marginBottom: 14,
          opacity: files.length >= 4 ? 0.5 : 1
        }}
      >
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)" }}>
          {files.length >= 4
            ? "Maximum 4 photos added"
            : `Tap to add photos (${files.length}/4)`}
        </p>
      </div>
      <input
        id="lbFileInput"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
        disabled={files.length >= 4}
      />

      {/* Thumbnails */}
      {files.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              position: "relative", width: 76, height: 76,
              borderRadius: 4, overflow: "hidden",
              transform: i % 2 === 0 ? "rotate(-2.5deg)" : "rotate(2.5deg)",
              boxShadow: "0 6px 14px -8px rgba(0,0,0,.5)"
            }}>
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <button
                onClick={() => removeFile(i)}
                style={{
                  position: "absolute", top: 2, right: 2,
                  width: 18, height: 18, borderRadius: "50%",
                  border: "none", background: "rgba(42,35,48,.75)",
                  color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      <button
        className="cta ghost"
        onClick={checkCoordination}
        disabled={files.length === 0 || loading}
      >
        {loading ? "AI is looking this over…" : "Check the coordination"}
      </button>

      {/* Loading indicator */}
      {loading && (
        <p style={{
          marginTop: 10, fontSize: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          color: "var(--gold)"
        }}>
          Analysing your outfit — usually 5–10 seconds…
        </p>
      )}

      {error && (
        <p style={{ color: "var(--rose-deep)", marginTop: 10, fontSize: 13 }}>{error}</p>
      )}

      {/* Feedback result */}
      {feedback && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", margin: "0 0 10px" }}>
            {feedback.verdict}
          </h3>
          <ul style={{ margin: "0 0 14px", paddingLeft: 18 }}>
            {feedback.notes.map((n, i) => (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{n}</li>
            ))}
          </ul>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5,
            color: "var(--rose-deep)",
            borderTop: "1px solid var(--line)", paddingTop: 12, margin: 0
          }}>
            FIX → {feedback.fix}
          </p>
        </div>
      )}
    </div>
  );
}
