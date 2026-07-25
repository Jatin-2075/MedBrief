import { useContext, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../Config/Api";
import { AuthContext } from "../Context/AuthContext";
import type { ChatMessage } from "../Config/Types";
import "../Css/Pages/Chat.css"

export default function Chat() {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    if (!authContext) throw new Error("AuthContext.Provider is required.");

    const { user } = authContext;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Prevent the whole page from scrolling — only the message list scrolls.
    // (This page manages its own fixed-height layout under the navbar.)
    useEffect(() => {
        document.body.classList.add("chat-active");
        return () => document.body.classList.remove("chat-active");
    }, []);

    useEffect(() => {
        const access = localStorage.getItem("access");
        if (!access) {
            navigate("/login");
            return;
        }

        if (!user) return;

        const loadMessages = async () => {
            setLoadingMessages(true);
            try {
                const data = await API<ChatMessage[]>("GET", `/system/chat/user/${user.id}`);
                setMessages([...data]);
            } catch (error) {
                setMessage("Unable to load chat history.");
            } finally {
                setLoadingMessages(false);
            }
        };

        loadMessages();
    }, [navigate, user]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!prompt.trim() || !user) {
            setMessage("Enter a question first.");
            return;
        }

        const currentQuery = prompt.trim();
        setPrompt("");
        setMessage(null);
        setLoading(true);

        const optimisticMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            user_query: currentQuery,
            ai_response: "Analyzing records...",
            chat_mode: "gemini",
            created_at: new Date().toISOString(),
            session_id: "temp"
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const payload = {
                user_query: currentQuery,
                chat_mode: "gemini",
            };
            const reply = await API<ChatMessage>("POST", "/system/chat", payload);

            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? reply : m));
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setPrompt(currentQuery);
            setMessage("Unable to send message.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (!loading) handleSend();
        }
    };

    return (
        <div className="chat-page-container">
            <div className="chat-history-viewport" ref={scrollRef}>
                <div className="chat-column">
                    <header className="chat-page-header">
                        <h1 className="chat-page-title">MedBrief AI</h1>
                        <p className="chat-page-subtitle">Ask your assistant about medical records, prescriptions, or clinical insights.</p>
                    </header>

                    {loadingMessages ? (
                        <div className="chat-status-alert">
                            <SpinnerIcon className="chat-spinner" />
                            <p>Reading secure clinical logs…</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="chat-status-alert empty">
                            <ChatBubbleIcon className="alert-icon" />
                            <h3>No Active Consultation</h3>
                            <p>Send a clinical diagnostic statement below to start your session history.</p>
                        </div>
                    ) : (
                        <div className="chat-dialog-stream">
                            {messages.map(msg => (
                                <div key={msg.id ?? `${msg.session_id}-${msg.created_at}`} className="dialog-block-pair">

                                    <div className="bubble-wrapper user">
                                        <div className="speech-bubble user">
                                            {msg.user_query}
                                        </div>
                                    </div>

                                    <div className="bubble-wrapper ai">
                                        <div className="ai-avatar">MB</div>
                                        <div className={`ai-response-text ${msg.id?.toString().startsWith("temp-") ? "typing-state" : ""}`}>
                                            {msg.ai_response}
                                            {msg.created_at && !msg.id?.toString().startsWith("temp-") && (
                                                <span className="bubble-timestamp">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-input-dock">
                <div className="chat-column">
                    {message && <div className="chat-error-toast">{message}</div>}
                    <div className="input-bar-group">
                        <textarea
                            className="dock-textarea"
                            rows={1}
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask MedBrief... (Press ⌘ + Enter to send)"
                        />
                        <button
                            type="button"
                            className="dock-send-btn"
                            onClick={handleSend}
                            disabled={loading || !prompt.trim()}
                            aria-label="Send Message"
                        >
                            {loading ? <SpinnerIcon /> : <ArrowUpIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Inline SVG icons — kept local so they never depend on an icon-font
   being loaded/available on the page (that's why the send arrow was
   invisible before: the "ti ti-arrow-up" glyph had nothing to render). */

function ArrowUpIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5L5 12M12 5l7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SpinnerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function ChatBubbleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}