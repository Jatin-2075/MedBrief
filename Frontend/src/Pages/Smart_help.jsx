import React, { useState } from "react";
import "../Style/SmartHelp.css";

const Smart_help = () => {
  const [conversations, setConversations] = useState([
    { id: 1, title: "New Chat", messages: [] },
  ]);

  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");

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

  const removeChat = (id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (id === activeId && updated.length > 0) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
  };

  // ✅ SEND MESSAGE
  const sendMessage = () => {
    if (!query.trim()) return;

    console.log("Message sent:", query);
    setQuery("");
  };

  // ✅ KEYBOARD HANDLER (ENTER vs SHIFT+ENTER)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-layout">
      {/* SIDEBAR */}
      <aside className="ai-sidebar">
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

      {/* MAIN */}
      <main className="ai-main">
        <h1 className="smart-help-title">Smart Help</h1>
        <p className="smart-help-subtitle">
          Ask SmartZen AI anything about health, reports, or lifestyle
        </p>

        {/* ✅ MULTILINE INPUT */}
        <div className="smart-help-search">
          <textarea
            placeholder="Ask SmartZen AI…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button onClick={sendMessage}>Ask</button>
        </div>

        <p className="input-hint">
          Press <b>Enter</b> to send • <b>Shift + Enter</b> for new line
        </p>
      </main>
    </div>
  );
};

export default Smart_help;
