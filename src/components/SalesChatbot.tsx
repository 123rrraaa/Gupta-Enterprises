import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
}

interface SalesData {
    totalOrders: number;
    totalRevenue: number;
    totalItems: number;
    totalCustomers: number;
    avgOrderValue: number;
    monthlyRevenue: { month: string; revenue: number; orders: number }[];
    categoryBreakdown: { name: string; value: number; revenue: number }[];
    productBreakdown: { name: string; value: number; revenue: number }[];
    dailyGrowth: { date: string; orders: number; revenue: number }[];
}

interface SalesChatbotProps {
    salesData: SalesData;
    allOrders: any[];
}

interface ConversationSummary {
    _id?: string;
    conversationId: string;
    summary: string;
    category: "Order" | "Refund" | "Payment" | "Technical" | "Other";
    sentiment: "Positive" | "Neutral" | "Negative";
    resolutionStatus: "Resolved" | "Escalated";
    messageCount: number;
    createdAt: string;
}

// ─── Quick Action Buttons ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
    { label: "📅 1 Month Prediction", prompt: "Predict my sales for the next 1 month based on the sales data provided. Give specific revenue numbers, expected growth rate, and key insights." },
    { label: "📊 3 Month Forecast", prompt: "Predict my sales for the next 3 months based on the sales data provided. Break it down month by month with expected revenue, growth trends, and actionable recommendations." },
    { label: "📈 6 Month Outlook", prompt: "Give me a detailed 6 month sales forecast based on the sales data provided. Include monthly revenue predictions, seasonal trends, risk factors, and strategies to maximize growth." },
    { label: "🎯 1 Year Projection", prompt: "Provide a comprehensive 1 year sales projection based on the sales data provided. Include quarterly breakdowns, growth trajectory, market opportunities, and strategic recommendations for scaling the business." },
];

// ─── AI API URLs ─────────────────────────────────────────────────────────────
const AI_API_URL = "http://localhost:5000/ai/chat";
const SUMMARIZE_API_URL = "http://localhost:5000/ai/summarize";
const SUMMARIES_API_URL = "http://localhost:5000/ai/summaries";

// ─── Backend AI Proxy Call ───────────────────────────────────────────────────
async function callAI(
    messages: { role: string; content: string }[]
): Promise<string> {
    const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `AI API error: ${response.status}`);
    }

    return data.choices?.[0]?.message?.content || "No response from AI.";
}

// ─── Generate unique conversation ID ─────────────────────────────────────────
function generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Build System Prompt with Sales Context ──────────────────────────────────
function buildSystemPrompt(salesData: SalesData): string {
    const { totalOrders, totalRevenue, totalItems, totalCustomers, avgOrderValue,
        monthlyRevenue, categoryBreakdown, productBreakdown } = salesData;

    return `You are an expert AI sales analyst and business consultant for "Gupta Enterprises", a water/beverage delivery business. You provide data-driven sales predictions, business insights, and growth strategies.

CURRENT BUSINESS DATA:
- Total Orders: ${totalOrders}
- Total Revenue: ₹${totalRevenue.toLocaleString("en-IN")}
- Total Items Sold: ${totalItems}
- Unique Customers: ${totalCustomers}
- Average Order Value: ₹${avgOrderValue.toLocaleString("en-IN")}

MONTHLY REVENUE HISTORY:
${monthlyRevenue.map(m => `  ${m.month}: ₹${m.revenue.toLocaleString("en-IN")} (${m.orders} orders)`).join("\n") || "  No monthly data available yet."}

SALES BY CATEGORY:
${categoryBreakdown.map(c => `  ${c.name}: ${c.value} units, ₹${c.revenue.toLocaleString("en-IN")}`).join("\n") || "  No category data available yet."}

TOP PRODUCTS:
${productBreakdown.slice(0, 5).map(p => `  ${p.name}: ${p.value} units, ₹${p.revenue.toLocaleString("en-IN")}`).join("\n") || "  No product data available yet."}

GUIDELINES:
- Always provide specific numbers for predictions (revenue in ₹, growth rates in %)
- Use the actual data above to inform predictions — apply linear regression and trend analysis mentally
- If data is limited, acknowledge it and state assumptions clearly
- Format responses with bullet points, headings, and clear structure
- Include actionable business recommendations
- Be honest about confidence levels based on available data
- Use Indian Rupee (₹) for all currency values
- Keep responses concise but insightful`;
}

// ─── Sentiment / Category / Status colors ────────────────────────────────────
const SENTIMENT_COLORS: Record<string, { bg: string; text: string }> = {
    Positive: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Neutral: { bg: "bg-slate-100", text: "text-slate-700" },
    Negative: { bg: "bg-red-100", text: "text-red-700" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Order: { bg: "bg-blue-100", text: "text-blue-700" },
    Refund: { bg: "bg-orange-100", text: "text-orange-700" },
    Payment: { bg: "bg-violet-100", text: "text-violet-700" },
    Technical: { bg: "bg-amber-100", text: "text-amber-700" },
    Other: { bg: "bg-gray-100", text: "text-gray-600" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Resolved: { bg: "bg-green-100", text: "text-green-700" },
    Escalated: { bg: "bg-rose-100", text: "text-rose-700" },
};

// ─── Chatbot Component ───────────────────────────────────────────────────────
const SalesChatbot: React.FC<SalesChatbotProps> = ({ salesData, allOrders }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(generateConversationId);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [pastSummaries, setPastSummaries] = useState<ConversationSummary[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, conversationSummary]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Add welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "👋 Hi! I'm your **AI Sales Analyst**.\n\nI can predict your future sales based on your business data. Try one of the quick actions below, or ask me anything about your sales!\n\n**Quick predictions available:**\n- 📅 Next 1 month\n- 📊 Next 3 months\n- 📈 Next 6 months\n- 🎯 Next 1 year",
                timestamp: new Date(),
            }]);
        }
    }, [isOpen]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

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
            const systemPrompt = buildSystemPrompt(salesData);
            const apiMessages = [
                { role: "system", content: systemPrompt },
                ...messages
                    .filter(m => m.role !== "system" && m.id !== "welcome")
                    .slice(-8)
                    .map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: content.trim() },
            ];

            const aiResponse = await callAI(apiMessages);

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: `❌ **Error:** ${error.message || "Failed to get AI response. Please try again."}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, salesData]);

    // ─── End & Summarize ─────────────────────────────────────────────────────
    const handleEndAndSummarize = useCallback(async () => {
        const realMessages = messages.filter(m => m.id !== "welcome" && m.role !== "system");
        if (realMessages.length < 2) return; // need at least 1 user + 1 assistant msg

        setIsSummarizing(true);
        try {
            const response = await fetch(SUMMARIZE_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId,
                    messages: realMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to summarize");
            }

            setConversationSummary(data);
        } catch (error: any) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: `❌ **Summary Error:** ${error.message || "Failed to generate summary."}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsSummarizing(false);
        }
    }, [messages, conversationId]);

    // ─── Fetch Past Summaries ────────────────────────────────────────────────
    const fetchPastSummaries = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(SUMMARIES_API_URL);
            const data = await response.json();
            if (Array.isArray(data)) {
                setPastSummaries(data);
            }
        } catch (error) {
            console.error("Failed to fetch summaries:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // ─── Clear / New Conversation ────────────────────────────────────────────
    const handleClear = () => {
        setMessages([]);
        setConversationSummary(null);
        setConversationId(generateConversationId());
        setShowHistory(false);
    };

    // ─── Render Summary Card ─────────────────────────────────────────────────
    const renderSummaryCard = (summary: ConversationSummary, compact = false) => {
        const catColor = CATEGORY_COLORS[summary.category] || CATEGORY_COLORS.Other;
        const sentColor = SENTIMENT_COLORS[summary.sentiment] || SENTIMENT_COLORS.Neutral;
        const statusColor = STATUS_COLORS[summary.resolutionStatus] || STATUS_COLORS.Resolved;

        return (
            <div className={`bg-white border border-indigo-200 rounded-xl ${compact ? "p-3" : "p-4"} shadow-sm`}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">📋</span>
                    <span className={`font-semibold ${compact ? "text-xs" : "text-sm"} text-indigo-700`}>
                        Conversation Summary
                    </span>
                </div>

                {/* Summary text */}
                <p className={`${compact ? "text-xs" : "text-sm"} text-gray-700 mb-3 leading-relaxed`}>
                    {summary.summary}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${catColor.bg} ${catColor.text}`}>
                        {summary.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sentColor.bg} ${sentColor.text}`}>
                        {summary.sentiment === "Positive" ? "😊" : summary.sentiment === "Negative" ? "😟" : "😐"}{" "}
                        {summary.sentiment}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor.bg} ${statusColor.text}`}>
                        {summary.resolutionStatus === "Resolved" ? "✅" : "⚠️"} {summary.resolutionStatus}
                    </span>
                </div>

                {/* Timestamp for compact (history) view */}
                {compact && summary.createdAt && (
                    <div className="text-[10px] text-gray-400 mt-2">
                        {new Date(summary.createdAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                        })}
                        {" · "}
                        {summary.messageCount} messages
                    </div>
                )}
            </div>
        );
    };

    // Simple markdown-like rendering
    const renderContent = (content: string) => {
        return content.split("\n").map((line, i) => {
            // Bold
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Bullet points
            if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                return <div key={i} className="pl-3 py-0.5" dangerouslySetInnerHTML={{ __html: `• ${line.trim().slice(2)}` }} />;
            }
            // Headings
            if (line.trim().startsWith("### ")) {
                return <h5 key={i} className="font-bold text-sm mt-2 mb-1" dangerouslySetInnerHTML={{ __html: line.trim().slice(4) }} />;
            }
            if (line.trim().startsWith("## ")) {
                return <h4 key={i} className="font-bold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: line.trim().slice(3) }} />;
            }
            if (line.trim().startsWith("# ")) {
                return <h3 key={i} className="font-bold text-lg mt-2 mb-1" dangerouslySetInnerHTML={{ __html: line.trim().slice(2) }} />;
            }
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: line }} />;
        });
    };

    // Check if we have enough messages to summarize (at least 1 user + 1 assistant beyond welcome)
    const canSummarize = messages.filter(m => m.id !== "welcome" && (m.role === "user" || m.role === "assistant")).length >= 2;

    return (
        <>
            {/* ─── Floating Chat Button ─────────────────────────────────────── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
                title="AI Sales Chatbot"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        AI
                    </span>
                )}
            </button>

            {/* ─── Chat Window ──────────────────────────────────────────────── */}
            {isOpen && (
                <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-[400px] h-full sm:h-auto sm:max-h-[600px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    style={{ animation: "slideUp 0.3s ease-out" }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
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
                            <span className="text-xl">🤖</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm">AI Sales Predictor</h3>
                            <p className="text-xs text-indigo-100">Powered by OpenAI GPT-4o</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* History Button */}
                            <button
                                onClick={() => {
                                    setShowHistory(!showHistory);
                                    if (!showHistory) fetchPastSummaries();
                                }}
                                className={`text-xs px-2 py-1 rounded transition-colors ${showHistory ? "bg-white/30 text-white" : "text-indigo-200 hover:text-white hover:bg-white/10"}`}
                                title="View past summaries"
                            >
                                📋
                            </button>
                            {/* End & Summarize Button */}
                            {canSummarize && !conversationSummary && (
                                <button
                                    onClick={handleEndAndSummarize}
                                    disabled={isSummarizing}
                                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
                                    title="End conversation and generate summary"
                                >
                                    {isSummarizing ? "⏳" : "📝 End & Summarize"}
                                </button>
                            )}
                            {/* Clear */}
                            <button
                                onClick={handleClear}
                                className="text-indigo-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                title="New conversation"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* ─── History Panel ───────────────────────────────────────── */}
                    {showHistory ? (
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm text-gray-700">📋 Conversation History</h4>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="text-xs text-indigo-500 hover:text-indigo-700"
                                >
                                    ← Back to chat
                                </button>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            ) : pastSummaries.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    <p className="text-2xl mb-2">📭</p>
                                    <p>No conversation summaries yet.</p>
                                    <p className="text-xs mt-1">End a conversation to generate one!</p>
                                </div>
                            ) : (
                                pastSummaries.map((s, idx) => (
                                    <div key={s._id || idx}>
                                        {renderSummaryCard(s, true)}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                                                ? "bg-indigo-500 text-white rounded-br-sm"
                                                : "bg-gray-100 text-gray-800 rounded-bl-sm"
                                                }`}
                                        >
                                            {msg.role === "assistant" ? (
                                                <div className="space-y-0.5 leading-relaxed">{renderContent(msg.content)}</div>
                                            ) : (
                                                msg.content
                                            )}
                                            <div className={`text-[10px] mt-2 ${msg.role === "user" ? "text-indigo-200" : "text-gray-400"}`}>
                                                {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Loading indicator */}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                                Analyzing sales data...
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Summarizing indicator */}
                                {isSummarizing && (
                                    <div className="flex justify-start">
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex items-center gap-2 text-indigo-600 text-sm">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                                Generating conversation summary...
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Conversation Summary Card */}
                                {conversationSummary && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[95%]">
                                            {renderSummaryCard(conversationSummary)}
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Actions */}
                            {messages.length <= 1 && !isLoading && !conversationSummary && (
                                <div className="px-4 pb-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {QUICK_ACTIONS.map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(action.prompt)}
                                                className="text-xs text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-100 hover:border-indigo-200"
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Box */}
                            <div className="p-3 border-t border-gray-100 bg-gray-50">
                                {conversationSummary ? (
                                    <div className="text-center py-1">
                                        <p className="text-xs text-gray-500 mb-2">Conversation ended and summarized.</p>
                                        <button
                                            onClick={handleClear}
                                            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            🔄 Start New Conversation
                                        </button>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={e => {
                                            e.preventDefault();
                                            sendMessage(input);
                                        }}
                                        className="flex gap-2"
                                    >
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Ask about your sales..."
                                            disabled={isLoading || isSummarizing}
                                            className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading || !input.trim() || isSummarizing}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Animation Keyframe */}
            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </>
    );
};

export default SalesChatbot;
