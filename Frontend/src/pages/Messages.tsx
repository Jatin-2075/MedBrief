import { useContext, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { API, WS_BASE_URL } from "../Config/Api";
import { AuthContext } from "../Context/AuthContext";
import type { ConversationSummary, DirectMessage, Doctor, Profile } from "../Config/Types";
import "../Css/Pages/Messages.css";

type PickerTarget = {
    other_user_id: string;
    name: string;
    subtitle: string;
};

export default function Messages() {
    const authContext = useContext(AuthContext);
    if (!authContext) return null;
    const { user } = authContext;

    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTargets, setPickerTargets] = useState<PickerTarget[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const activeIdRef = useRef<string | null>(null);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    const activeConvo = conversations.find((c) => c.id === activeId) ?? null;

    // ── load inbox ──────────────────────────────────────────────────────────
    const loadConversations = async () => {
        try {
            const data = await API<ConversationSummary[]>("GET", "/messaging/conversations");
            setConversations(data);
            return data;
        } catch {
            setError("Unable to load conversations.");
            return [];
        } finally {
            setLoadingConvos(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        loadConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ── open a conversation: fetch history + connect socket ────────────────
    const openConversation = async (conversationId: string) => {
        setActiveId(conversationId);
        setMessages([]);
        setLoadingMessages(true);
        setError(null);

        try {
            const history = await API<DirectMessage[]>(
                "GET",
                `/messaging/conversations/${conversationId}/messages`
            );
            setMessages(history);
            await API("PATCH", `/messaging/conversations/${conversationId}/read`);
            setConversations((prev) =>
                prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
            );
        } catch {
            setError("Unable to load this conversation.");
        } finally {
            setLoadingMessages(false);
        }

        connectSocket(conversationId);
    };

    const connectSocket = (conversationId: string) => {
        socketRef.current?.close();

        const access = localStorage.getItem("access");
        if (!access) return;

        const ws = new WebSocket(
            `${WS_BASE_URL}/messaging/ws/${conversationId}?token=${encodeURIComponent(access)}`
        );

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type !== "message") return;
                const msg: DirectMessage = payload.data;

                if (msg.conversation_id === activeIdRef.current) {
                    setMessages((prev) =>
                        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
                    );
                }

                // refresh inbox previews/unread counts regardless of which thread is open
                loadConversations();
            } catch {
                // ignore malformed frames
            }
        };

        socketRef.current = ws;
    };

    useEffect(() => {
        return () => {
            socketRef.current?.close();
        };
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    // ── send ─────────────────────────────────────────────────────────────────
    const handleSend = async () => {
        const content = draft.trim();
        if (!content || !activeId) return;

        setDraft("");

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ content }));
            return;
        }

        // REST fallback if the socket isn't connected
        try {
            const sent = await API<DirectMessage>(
                "POST",
                `/messaging/conversations/${activeId}/messages`,
                { content }
            );
            setMessages((prev) => [...prev, sent]);
        } catch {
            setError("Message failed to send. Check your connection.");
            setDraft(content);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── new conversation picker ─────────────────────────────────────────────
    const openPicker = async () => {
        setPickerOpen(true);
        setPickerLoading(true);
        try {
            if (user?.role === "doctor") {
                const patients = await API<Profile[]>("GET", "/personal/my-patients");
                setPickerTargets(
                    patients
                        .filter((p) => !!p.user_id)
                        .map((p) => ({
                            other_user_id: p.user_id as string,
                            name: p.name ?? "Patient",
                            subtitle: p.age ? `${p.age} yrs` : "Patient",
                        }))
                );
            } else {
                const doctors = await API<Doctor[]>("GET", "/personal/doctors");
                setPickerTargets(
                    doctors
                        .filter((d) => !!d.user_id)
                        .map((d) => ({
                            other_user_id: d.user_id as string,
                            name: d.name ?? "Doctor",
                            subtitle: d.specialization ?? "General Practitioner",
                        }))
                );
            }
        } catch {
            setError("Unable to load contacts.");
        } finally {
            setPickerLoading(false);
        }
    };

    const startConversation = async (target: PickerTarget) => {
        try {
            const convo = await API<ConversationSummary>("POST", "/messaging/conversations", {
                other_user_id: target.other_user_id,
            });
            setPickerOpen(false);
            const fresh = await loadConversations();
            const match = fresh.find((c) => c.id === convo.id);
            await openConversation(match?.id ?? convo.id);
        } catch {
            setError("Unable to start conversation.");
        }
    };

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="messages-page-container">
            <aside className="messages-inbox-panel">
                <div className="messages-inbox-header">
                    <h2>Messages</h2>
                    <button className="inbox-new-chat-btn" onClick={openPicker}>
                        + New
                    </button>
                </div>

                <div className="messages-inbox-list">
                    {loadingConvos ? (
                        <div className="messages-inbox-empty">
                            <div className="messages-loader-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="messages-inbox-empty">
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map((c) => (
                            <button
                                key={c.id}
                                className={`inbox-convo-row ${activeId === c.id ? "active" : ""}`}
                                onClick={() => openConversation(c.id)}
                            >
                                <div className="inbox-avatar">
                                    {c.other_user.username?.charAt(0).toUpperCase() ?? "?"}
                                </div>
                                <div className="inbox-convo-meta">
                                    <div className="inbox-convo-top-row">
                                        <span className="inbox-convo-name">{c.other_user.username}</span>
                                        {c.unread_count > 0 && (
                                            <span className="inbox-unread-badge">{c.unread_count}</span>
                                        )}
                                    </div>
                                    <span className="inbox-convo-preview">
                                        {c.last_message_preview ?? "Say hello 👋"}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            <section className="messages-chat-panel">
                {!activeConvo ? (
                    <div className="messages-chat-empty-state">
                        <div className="alert-icon">💬</div>
                        <h3>Select a conversation</h3>
                        <p>Pick a thread from the left, or start a new one.</p>
                    </div>
                ) : (
                    <>
                        <header className="messages-chat-header">
                            <div className="inbox-avatar">
                                {activeConvo.other_user.username?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                                <h3>{activeConvo.other_user.username}</h3>
                                <span className={`messages-status-dot ${connected ? "online" : "offline"}`}>
                                    {connected ? "Live" : "Reconnecting…"}
                                </span>
                            </div>
                        </header>

                        <div className="messages-history-viewport" ref={scrollRef}>
                            {loadingMessages ? (
                                <div className="messages-loader-spin" />
                            ) : messages.length === 0 ? (
                                <div className="messages-chat-empty-state inline">
                                    <p>No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                messages.map((m) => {
                                    const isMine = m.sender_id === user?.id;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`msg-bubble-wrapper ${isMine ? "mine" : "theirs"}`}
                                        >
                                            <div className={`msg-speech-bubble ${isMine ? "mine" : "theirs"}`}>
                                                {m.content}
                                                <span className="msg-timestamp">
                                                    {new Date(m.created_at).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {error && <div className="messages-error-toast">{error}</div>}

                        <div className="messages-input-dock">
                            <div className="messages-input-bar">
                                <textarea
                                    className="messages-textarea"
                                    placeholder="Type a message…"
                                    rows={1}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    className="messages-send-btn"
                                    onClick={handleSend}
                                    disabled={!draft.trim()}
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {pickerOpen && (
                <div className="messages-picker-overlay" onClick={() => setPickerOpen(false)}>
                    <div className="messages-picker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="messages-picker-header">
                            <h3>Start a conversation</h3>
                            <button className="picker-close-btn" onClick={() => setPickerOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="messages-picker-list">
                            {pickerLoading ? (
                                <div className="messages-loader-spin" />
                            ) : pickerTargets.length === 0 ? (
                                <p className="picker-empty-text">
                                    {user?.role === "doctor"
                                        ? "No patients assigned to you yet."
                                        : "No doctors available."}
                                </p>
                            ) : (
                                pickerTargets.map((t) => (
                                    <button
                                        key={t.other_user_id}
                                        className="picker-target-row"
                                        onClick={() => startConversation(t)}
                                    >
                                        <div className="inbox-avatar">{t.name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div className="picker-target-name">{t.name}</div>
                                            <div className="picker-target-subtitle">{t.subtitle}</div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}