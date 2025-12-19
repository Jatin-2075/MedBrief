import "../Style/SmartHelp.css";

const Smart_help = () => {
  const [conversations, setConversations] = useState([
    { id: 1, title: "New Chat", messages: [] },
  ]);
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");

  const chatEndRef = useRef(null);

  // ===============================
  // ACTIVE CONVERSATION (SAFE)
  // ===============================
  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0];

  // ===============================
  // CREATE NEW CHAT
  // ===============================
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

  // ===============================
  // REMOVE CHAT
  // ===============================
  const removeChat = (id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (id === activeId && updated.length > 0) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
  };

  // ===============================
  // SEND MESSAGE
  // ===============================
  const sendMessage = () => {
    if (!query.trim()) return;

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? {
              ...conv,
              messages: [...conv.messages, { role: "user", text: query }],
            }
          : conv
      )
    );

    setQuery("");
  };

  // ===============================
  // ENTER vs SHIFT+ENTER
  // ===============================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ===============================
  // AUTO SCROLL
  // ===============================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation.messages]);

  return (
    <div className="ai-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="ai-sidebar">
        <button className="new-chat-btn" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="chat-history">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`chat-item ${conv.id === activeId ? "active" : ""}`}
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

      {/* ================= MAIN ================= */}
      <main className="ai-main">
        <h1 className="smart-help-title">Smart Help</h1>
        <p className="smart-help-subtitle">
          Ask SmartZen AI anything about health, reports, or lifestyle
        </p>

        {/* ================= CHAT WINDOW ================= */}
        <div
          className={`chat-window ${
            activeConversation.messages.length === 0 ? "empty" : ""
          }`}
        >
          {activeConversation.messages.length === 0 ? (
            <div className="empty-chat">
              Start a conversation by typing below 👇
            </div>
          ) : (
            activeConversation.messages.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ================= INPUT ================= */}
        <div className="smart-help-search">
          <textarea
            className="chat-textarea"
            placeholder="Ask SmartZen AI…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={handleKeyDown}
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
