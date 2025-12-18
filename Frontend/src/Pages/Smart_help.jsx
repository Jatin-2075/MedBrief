import React, { useState } from "react";
import "../Style/SmartHelp.css";

const Smart_help = () => {
  const [conversations, setConversations] = useState([
    { id: 1, title: "New Chat", messages: [] },
  ]);

  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");

  // ✅ CREATE NEW CHAT (RESTORED)
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveId(newChat.id);
    setQuery("");
  };

  // ✅ REMOVE CHAT (ON HOVER)
  const removeChat = (id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);

      if (id === activeId && updated.length > 0) {
        setActiveId(updated[0].id);
      }

      return updated;
    });
  };

  return (
    <div className="ai-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="ai-sidebar">
        {/* ✅ NEW CHAT BUTTON (VISIBLE ALWAYS) */}
        <button className="new-chat-btn" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="chat-history">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`chat-item ${
                conv.id === activeId ? "active" : ""
              }`}
              onClick={() => setActiveId(conv.id)}
            >
              <span className="chat-title">{conv.title}</span>

              {/* ❌ REMOVE BUTTON (ON HOVER ONLY) */}
              <span
                className="chat-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChat(conv.id);
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="ai-main">
        <h1 className="smart-help-title">Smart Help</h1>
        <p className="smart-help-subtitle">
          Ask SmartZen AI anything about health, reports, or lifestyle
        </p>

        <div className="smart-help-search">
          <input
            type="text"
            placeholder="Ask SmartZen AI…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button>Ask</button>
        </div>
      </main>
    </div>
  );
};

export default Smart_help;
