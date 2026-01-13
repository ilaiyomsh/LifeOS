import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { taskText, domain } = req.body;

        // Validate input
        if (!taskText || !domain) {
            return res.status(400).json({ error: 'Missing required fields: taskText and domain' });
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

        const prompt = `
            Analyze task: "${taskText}"
            Domain: "${domain}"
            Current Date: "${new Date().toISOString().split('T')[0]}"
            Scales 1-5 (5 is highest). Estimate 'duration' in minutes.
            Output JSON only: { "importance": int, "urgency": int, "duration": int, "reasoning": "string (hebrew)" }
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

        return res.status(200).json(parsed);

    } catch (error) {
        console.error("AI Analysis failed", error);
        
        // Handle rate limiting
        if (error.message?.includes('429') || error.message?.includes('quota')) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
        }

        // Handle other errors
        return res.status(500).json({ 
            error: error.message || 'AI Analysis failed' 
        });
    }
}

