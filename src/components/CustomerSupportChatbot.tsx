import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
}

interface ConversationSummary {
    _id?: string;
    conversationId: string;
    summary: string;
    category: string;
    sentiment: string;
    resolutionStatus: string;
    messageCount: number;
    createdAt: string;
}

// ─── Quick Action Buttons ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
    { label: "📦 Track My Order", prompt: "I want to track my order. Can you help?" },
    { label: "💰 Refund Request", prompt: "I'd like to request a refund for my order." },
    { label: "❌ Cancel Order", prompt: "I want to cancel my order." },
    { label: "🚚 Delivery Status", prompt: "When will my order be delivered?" },
    { label: "💳 Payment Issue", prompt: "I'm having trouble with my payment." },
    { label: "📞 Talk to Agent", prompt: "I need to speak with a human agent." },
];

// ─── API URLs ────────────────────────────────────────────────────────────────
const AI_CHAT_URL = "http://localhost:5000/ai/chat";
const SUMMARIZE_URL = "http://localhost:5000/ai/summarize";
const SUMMARIES_URL = "http://localhost:5000/ai/summaries";
const TICKET_URL = "http://localhost:5000/ai/support-ticket";

// ─── Escalation Keywords Detection ───────────────────────────────────────────
const PAYMENT_KEYWORDS = ["payment", "pay", "paid", "transaction", "charge", "charged", "debit", "deducted", "upi", "credit card", "debit card", "net banking", "billing", "invoice"];
const REFUND_KEYWORDS = ["refund", "money back", "return money", "reimburse", "reimbursement", "cashback", "cash back", "return", "refunded"];
const AGENT_KEYWORDS = ["human agent", "talk to agent", "speak to someone", "real person", "human support", "call me", "phone call", "contact number", "manager", "supervisor", "escalate", "talk to human", "speak with agent", "connect me"];

function detectEscalationType(text: string): "Payment" | "Refund" | "Agent Request" | null {
    const lower = text.toLowerCase();
    if (AGENT_KEYWORDS.some(k => lower.includes(k))) return "Agent Request";
    if (REFUND_KEYWORDS.some(k => lower.includes(k))) return "Refund";
    if (PAYMENT_KEYWORDS.some(k => lower.includes(k))) return "Payment";
    return null;
}

function detectPriority(text: string): "Low" | "Medium" | "High" {
    const lower = text.toLowerCase();
    const urgentWords = ["urgent", "immediately", "asap", "right now", "emergency", "angry", "frustrated", "terrible", "worst", "unacceptable", "scam", "fraud", "cheat"];
    if (urgentWords.some(w => lower.includes(w))) return "High";
    if (AGENT_KEYWORDS.some(k => lower.includes(k))) return "High";
    return "Medium";
}

// ─── AI Call ─────────────────────────────────────────────────────────────────
async function callAI(messages: { role: string; content: string }[]): Promise<string> {
    const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `AI error: ${res.status}`);
    return data.choices?.[0]?.message?.content || "No response from AI.";
}

// ─── Unique ID ───────────────────────────────────────────────────────────────
function genId(): string {
    return `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ─── System Prompt ───────────────────────────────────────────────────────────
const SUPPORT_SYSTEM_PROMPT = `You are an AI Customer Support Assistant for "Gupta Enterprises", an e-commerce water and beverage delivery platform.

YOUR RESPONSIBILITIES:
- Greet customers politely.
- Understand customer queries clearly.
- Provide accurate and helpful responses.
- Ask clarifying questions if needed.
- Stay professional, friendly, and concise.
- If the query is complex or you cannot resolve it, inform the user: "I will connect you to our support team for further assistance."
- Do not provide false information.
- If you don't know the answer, say: "I will connect you to our support team for further assistance."

BUSINESS RULES:
- Refund is allowed within 7 days of delivery.
- Order cancellation is allowed only before shipping.
- Delivery time: 3–5 working days.
- Working hours: 9 AM – 6 PM IST (Monday to Saturday).
- No deliveries on Sundays or national holidays.

GUIDELINES:
- Keep answers short, clear, and professional.
- Use simple language.
- Maintain context of the conversation.
- Provide step-by-step instructions when needed.
- Never discuss internal system details.
- If the user asks something outside policy, politely explain the policy.
- If the user is angry or frustrated, respond empathetically and apologize.
- If the user repeats the same complaint twice, escalate to a human agent by saying: "I understand your frustration. Let me escalate this to our support team for quicker resolution."
- Use Indian Rupee (₹) for all currency values.
- Format responses with bullet points and clear structure.`;

// ─── Color Maps ──────────────────────────────────────────────────────────────
const SENTIMENT_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
    Positive: { bg: "bg-emerald-100", text: "text-emerald-700", emoji: "😊" },
    Neutral: { bg: "bg-slate-100", text: "text-slate-700", emoji: "😐" },
    Negative: { bg: "bg-red-100", text: "text-red-700", emoji: "😟" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Order: { bg: "bg-blue-100", text: "text-blue-700" },
    Refund: { bg: "bg-orange-100", text: "text-orange-700" },
    Payment: { bg: "bg-violet-100", text: "text-violet-700" },
    Technical: { bg: "bg-amber-100", text: "text-amber-700" },
    Other: { bg: "bg-gray-100", text: "text-gray-600" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
    Resolved: { bg: "bg-green-100", text: "text-green-700", emoji: "✅" },
    Escalated: { bg: "bg-rose-100", text: "text-rose-700", emoji: "⚠️" },
};

// ─── Component ───────────────────────────────────────────────────────────────
const CustomerSupportChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(genId);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState<ConversationSummary | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [pastSummaries, setPastSummaries] = useState<ConversationSummary[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, summary]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    // Welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "👋 Hello! Welcome to **Gupta Enterprises** customer support.\n\nI'm here to help you with:\n- 📦 Order tracking & delivery\n- 💰 Refunds & returns\n- ❌ Order cancellations\n- 💳 Payment issues\n- ❓ General queries\n\nHow can I assist you today?",
                timestamp: new Date(),
            }]);
        }
    }, [isOpen]);

    // ─── Send Message ────────────────────────────────────────────────────
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || summary) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const apiMessages = [
                { role: "system", content: SUPPORT_SYSTEM_PROMPT },
                ...messages
                    .filter(m => m.role !== "system" && m.id !== "welcome")
                    .slice(-10)
                    .map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: content.trim() },
            ];

            const aiResponse = await callAI(apiMessages);

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
            }]);

            // ─── Auto-detect escalation & create ticket for admin ─────────
            const escalationType = detectEscalationType(content.trim());
            if (escalationType) {
                try {
                    await fetch(TICKET_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            conversationId,
                            type: escalationType,
                            customerMessage: content.trim(),
                            aiResponse,
                            priority: detectPriority(content.trim()),
                        }),
                    });
                    // Show a subtle notification in chat
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 2).toString(),
                        role: "assistant",
                        content: `🔔 *Your ${escalationType.toLowerCase()} issue has been flagged to our support team. An admin will review it shortly.*`,
                        timestamp: new Date(),
                    }]);
                } catch (ticketErr) {
                    console.error("Failed to create support ticket:", ticketErr);
                }
            }
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `❌ **Error:** ${error.message || "Something went wrong. Please try again."}`,
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, summary, conversationId]);

    // ─── End & Summarize ─────────────────────────────────────────────────
    const handleSummarize = useCallback(async () => {
        const real = messages.filter(m => m.id !== "welcome" && (m.role === "user" || m.role === "assistant"));
        if (real.length < 2) return;

        setIsSummarizing(true);
        try {
            const res = await fetch(SUMMARIZE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId,
                    messages: real.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to summarize");
            setSummary(data);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `❌ **Summary Error:** ${error.message}`,
                timestamp: new Date(),
            }]);
        } finally {
            setIsSummarizing(false);
        }
    }, [messages, conversationId]);

    // ─── Fetch History ───────────────────────────────────────────────────
    const fetchHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch(SUMMARIES_URL);
            const data = await res.json();
            if (Array.isArray(data)) setPastSummaries(data);
        } catch (e) {
            console.error("Failed to fetch summaries:", e);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // ─── New Conversation ────────────────────────────────────────────────
    const handleClear = () => {
        setMessages([]);
        setSummary(null);
        setConversationId(genId());
        setShowHistory(false);
    };

    // ─── Can Summarize? ──────────────────────────────────────────────────
    const canSummarize = messages.filter(m => m.id !== "welcome" && (m.role === "user" || m.role === "assistant")).length >= 2;

    // ─── Render Markdown ─────────────────────────────────────────────────
    const renderContent = (content: string) =>
        content.split("\n").map((line, i) => {
            line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            if (line.trim().startsWith("- ") || line.trim().startsWith("• "))
                return <div key={i} className="pl-3 py-0.5" dangerouslySetInnerHTML={{ __html: `• ${line.trim().slice(2)}` }} />;
            if (line.trim().startsWith("### "))
                return <h5 key={i} className="font-bold text-sm mt-2 mb-1" dangerouslySetInnerHTML={{ __html: line.trim().slice(4) }} />;
            if (line.trim().startsWith("## "))
                return <h4 key={i} className="font-bold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: line.trim().slice(3) }} />;
            if (line.trim().startsWith("# "))
                return <h3 key={i} className="font-bold text-lg mt-2 mb-1" dangerouslySetInnerHTML={{ __html: line.trim().slice(2) }} />;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: line }} />;
        });

    // ─── Render Summary Card ─────────────────────────────────────────────
    const renderSummaryCard = (s: ConversationSummary, compact = false) => {
        const cat = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.Other;
        const sent = SENTIMENT_COLORS[s.sentiment] || SENTIMENT_COLORS.Neutral;
        const stat = STATUS_COLORS[s.resolutionStatus] || STATUS_COLORS.Resolved;

        return (
            <div className={`bg-white border border-blue-200 rounded-xl ${compact ? "p-3" : "p-4"} shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">📋</span>
                    <span className={`font-semibold ${compact ? "text-xs" : "text-sm"} text-blue-700`}>
                        Conversation Summary
                    </span>
                </div>
                <p className={`${compact ? "text-xs" : "text-sm"} text-gray-700 mb-3 leading-relaxed`}>{s.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cat.bg} ${cat.text}`}>
                        {s.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sent.bg} ${sent.text}`}>
                        {sent.emoji} {s.sentiment}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${stat.bg} ${stat.text}`}>
                        {stat.emoji} {s.resolutionStatus}
                    </span>
                </div>
                {compact && s.createdAt && (
                    <div className="text-[10px] text-gray-400 mt-2">
                        {new Date(s.createdAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                        })}
                        {" · "}{s.messageCount} messages
                    </div>
                )}
            </div>
        );
    };

    // ─── Bounce Dots ─────────────────────────────────────────────────────
    const BounceDots = ({ color = "bg-blue-400" }: { color?: string }) => (
        <div className="flex gap-1">
            <span className={`w-2 h-2 ${color} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }} />
            <span className={`w-2 h-2 ${color} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }} />
            <span className={`w-2 h-2 ${color} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }} />
        </div>
    );

    return (
        <>
            {/* ─── Floating Button ────────────────────────────────────────── */}
            <button
                id="customer-support-btn"
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                title="Customer Support"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        💬
                    </span>
                )}
            </button>

            {/* ─── Chat Window ───────────────────────────────────────────── */}
            {isOpen && (
                <div
                    id="customer-support-window"
                    className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-[400px] h-full sm:h-auto sm:max-h-[600px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    style={{ animation: "csSlideUp 0.3s ease-out" }}
                >
                    {/* ── Header ──────────────────────────────────────────── */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => { setIsOpen(false); window.location.href = '/'; }}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            title="Back to Home"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <span className="text-xl">🎧</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm">Customer Support</h3>
                            <p className="text-xs text-blue-100">
                                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />
                                Online · Gupta Enterprises
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}
                                className={`text-xs px-2 py-1 rounded transition-colors ${showHistory ? "bg-white/30 text-white" : "text-blue-200 hover:text-white hover:bg-white/10"}`}
                                title="Past summaries"
                            >📋</button>
                            {canSummarize && !summary && (
                                <button
                                    onClick={handleSummarize}
                                    disabled={isSummarizing}
                                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
                                    title="End & generate summary"
                                >
                                    {isSummarizing ? "⏳" : "📝 End"}
                                </button>
                            )}
                            <button
                                onClick={handleClear}
                                className="text-blue-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                title="New conversation"
                            >Clear</button>
                        </div>
                    </div>

                    {/* ── History Panel ────────────────────────────────────── */}
                    {showHistory ? (
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm text-gray-700">📋 Past Conversations</h4>
                                <button onClick={() => setShowHistory(false)} className="text-xs text-blue-500 hover:text-blue-700">
                                    ← Back
                                </button>
                            </div>
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-8"><BounceDots /></div>
                            ) : pastSummaries.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    <p className="text-2xl mb-2">📭</p>
                                    <p>No past summaries yet.</p>
                                    <p className="text-xs mt-1">End a conversation to generate one!</p>
                                </div>
                            ) : (
                                pastSummaries.map((s, i) => <div key={s._id || i}>{renderSummaryCard(s, true)}</div>)
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── Messages ────────────────────────────────── */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                                            ? "bg-blue-500 text-white rounded-br-sm"
                                            : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}
                                        >
                                            {msg.role === "assistant"
                                                ? <div className="space-y-0.5 leading-relaxed">{renderContent(msg.content)}</div>
                                                : msg.content}
                                            <div className={`text-[10px] mt-2 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                                                {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <BounceDots />
                                                Typing...
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isSummarizing && (
                                    <div className="flex justify-start">
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex items-center gap-2 text-blue-600 text-sm">
                                                <BounceDots color="bg-blue-400" />
                                                Generating summary...
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {summary && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[95%]">{renderSummaryCard(summary)}</div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Quick Actions ───────────────────────────── */}
                            {messages.length <= 1 && !isLoading && !summary && (
                                <div className="px-4 pb-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {QUICK_ACTIONS.map((a, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(a.prompt)}
                                                className="text-xs text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-100 hover:border-blue-200"
                                            >
                                                {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Input ────────────────────────────────────── */}
                            <div className="p-3 border-t border-gray-100 bg-gray-50">
                                {summary ? (
                                    <div className="text-center py-1">
                                        <p className="text-xs text-gray-500 mb-2">Conversation ended.</p>
                                        <button
                                            onClick={handleClear}
                                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            🔄 New Conversation
                                        </button>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={e => { e.preventDefault(); sendMessage(input); }}
                                        className="flex gap-2"
                                    >
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Type your question..."
                                            disabled={isLoading || isSummarizing}
                                            className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading || !input.trim() || isSummarizing}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Animation */}
            <style>{`
                @keyframes csSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};

export default CustomerSupportChatbot;
