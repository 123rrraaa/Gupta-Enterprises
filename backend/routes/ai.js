const express = require('express');
const router = express.Router();
const ChatSummary = require('../models/ChatSummary');
const SupportTicket = require('../models/SupportTicket');

// ─── Helper: call the AI API ─────────────────────────────────────────────────
async function callAIAPI(messages, temperature = 0.7, maxTokens = 1500) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('AI API key not configured in backend .env');

    const isOpenRouter = apiKey.startsWith('sk-or-');
    const apiUrl = isOpenRouter
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };
    if (isOpenRouter) {
        headers['HTTP-Referer'] = 'http://localhost:8080';
        headers['X-Title'] = 'Gupta Enterprises Sales Predictor';
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
            messages,
            temperature,
            max_tokens: maxTokens,
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || `AI API error: ${response.status}`);
    }
    return data;
}

// ─── POST /ai/chat — Proxy AI chat completions ──────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array is required' });
        }
        const data = await callAIAPI(messages);
        res.json(data);
    } catch (error) {
        console.error('AI proxy error:', error);
        res.status(500).json({ error: error.message || 'Failed to connect to AI API' });
    }
});

// ─── POST /ai/summarize — Generate & save conversation summary ──────────────
router.post('/summarize', async (req, res) => {
    try {
        const { conversationId, messages } = req.body;

        if (!conversationId || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'conversationId and messages[] are required' });
        }

        // Filter to only user/assistant messages (skip system + welcome)
        const chatMessages = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `You are an expert conversation analyst. Analyze the following customer-agent conversation and return a JSON object with exactly these fields:

1. "summary": A professional 1-2 line summary of the user's issue or query.
2. "category": Exactly one of: "Order", "Refund", "Payment", "Technical", "Other".
3. "sentiment": Exactly one of: "Positive", "Neutral", "Negative".
4. "resolutionStatus": Exactly one of: "Resolved", "Escalated".

Rules:
- Keep the summary short (max 2 sentences) and professional.
- Choose "Escalated" only if the issue was clearly unresolved or needs human follow-up.
- Return ONLY valid JSON, no markdown, no explanation, no code fences.

Example output:
{"summary":"Customer requested a 3-month sales forecast and received detailed predictions.","category":"Other","sentiment":"Positive","resolutionStatus":"Resolved"}`;

        const aiMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Conversation:\n${chatMessages}` },
        ];

        const data = await callAIAPI(aiMessages, 0.3, 500);
        const rawContent = data.choices?.[0]?.message?.content || '';

        // Parse the JSON response from AI
        let parsed;
        try {
            // Strip possible markdown code fences
            const cleaned = rawContent.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('Failed to parse AI summary JSON:', rawContent);
            return res.status(500).json({ error: 'AI returned invalid summary format' });
        }

        // Validate and default values
        const validCategories = ['Order', 'Refund', 'Payment', 'Technical', 'Other'];
        const validSentiments = ['Positive', 'Neutral', 'Negative'];
        const validStatuses = ['Resolved', 'Escalated'];

        const summaryDoc = {
            conversationId,
            summary: parsed.summary || 'No summary available.',
            category: validCategories.includes(parsed.category) ? parsed.category : 'Other',
            sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'Neutral',
            resolutionStatus: validStatuses.includes(parsed.resolutionStatus) ? parsed.resolutionStatus : 'Resolved',
            messageCount: messages.filter(m => m.role === 'user' || m.role === 'assistant').length,
        };

        // Upsert (in case they re-summarize the same conversation)
        const saved = await ChatSummary.findOneAndUpdate(
            { conversationId },
            summaryDoc,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json(saved);
    } catch (error) {
        console.error('Summarize error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate summary' });
    }
});

// ─── GET /ai/summaries — Retrieve past conversation summaries ────────────────
router.get('/summaries', async (req, res) => {
    try {
        const summaries = await ChatSummary.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        res.json(summaries);
    } catch (error) {
        console.error('Fetch summaries error:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
});

// ─── POST /ai/support-ticket — Create a support ticket for admin ─────────────
router.post('/support-ticket', async (req, res) => {
    try {
        const { conversationId, type, customerMessage, aiResponse, priority } = req.body;

        if (!conversationId || !type || !customerMessage) {
            return res.status(400).json({ error: 'conversationId, type, and customerMessage are required' });
        }

        const validTypes = ['Payment', 'Refund', 'Agent Request', 'Other'];
        const validPriorities = ['Low', 'Medium', 'High'];

        const ticket = new SupportTicket({
            conversationId,
            type: validTypes.includes(type) ? type : 'Other',
            customerMessage,
            aiResponse: aiResponse || '',
            priority: validPriorities.includes(priority) ? priority : 'Medium',
        });

        const saved = await ticket.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: error.message || 'Failed to create support ticket' });
    }
});

// ─── GET /ai/support-tickets — Fetch all support tickets for admin ───────────
router.get('/support-tickets', async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(tickets);
    } catch (error) {
        console.error('Fetch tickets error:', error);
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
});

// ─── PUT /ai/support-tickets/:id — Update ticket status ──────────────────────
router.put('/support-tickets/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Valid status required: Open, In Progress, Resolved, Closed' });
        }

        const updated = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

module.exports = router;
