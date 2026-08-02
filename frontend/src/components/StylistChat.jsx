// StylistChat.jsx — top of the component, and the fetch body
import { useState, useRef } from "react";
import { getWardrobe } from "../api";

export default function StylistChat() {
  const sessionId = useRef(crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      let wardrobeItems = [];
      try { wardrobeItems = await getWardrobe(); } catch {}

      const res = await fetch(`${AI_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId.current,
          wardrobe_items: wardrobeItems,
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply, products: data.products }]);
    } catch (err) {
      setMessages(m => [...m, { role: "assistant", content: "Something went wrong — is the AI service running?" }]);
    }
    setLoading(false);
  }
  

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "500px", maxWidth: "600px" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "12px", textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: "12px",
                           background: m.role === "user" ? "#3D2B50" : "#F0EAE0",
                           color: m.role === "user" ? "#fff" : "#241B2E" }}>
              {m.content}
            </span>
            {m.products && m.products.length > 0 && (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {m.products.map((p, j) => (
                  <a key={j} href={p.link || p.url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#B05D68" }}>
                    {p.platform || p.site || "Shop"} — {p.title || p.query || "View"}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div>Thinking...</div>}
      </div>
      <div style={{ display: "flex", gap: "8px", padding: "12px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask your stylist..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}