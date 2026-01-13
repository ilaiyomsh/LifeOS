import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tasks, startTime } = req.body;

        // Validate input
        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid tasks array' });
        }

        if (!startTime) {
            return res.status(400).json({ error: 'Missing required field: startTime' });
        }

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const tasksJson = JSON.stringify(tasks.map(t => ({
            id: t.id,
            text: t.text,
            domain: t.domain,
            importance: t.importance,
            urgency: t.urgency,
            duration: t.duration || 60
        })));

        const prompt = `
            You are a master scheduler. Organize these tasks into an optimal daily schedule starting at ${startTime}.
            Rules:
            1. High importance "Deep Work" (Study/Work) should generally be earlier in the day when energy is high.
            2. "Household" or low importance tasks can be later or used as breaks.
            3. Group similar domains if logical.
            
            Tasks: ${tasksJson}

            Return ONLY a JSON array of task IDs in the optimal order. Example: [1, 4, 2, 3]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            return res.status(500).json({ error: 'No response from AI' });
        }

        // Clean javascript markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        // Validate that we got an array
        if (!Array.isArray(parsed)) {
            return res.status(500).json({ error: 'Invalid response format from AI' });
        }

        return res.status(200).json(parsed);

    } catch (error) {
        console.error("AI Optimization failed", error);
        
        // Handle rate limiting
        if (error.message?.includes('429') || error.message?.includes('quota')) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
        }

        // Handle other errors
        return res.status(500).json({ 
            error: error.message || 'Schedule optimization failed' 
        });
    }
}

