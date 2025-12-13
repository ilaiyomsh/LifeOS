import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

const getModel = (apiKey) => {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    // gemini-2.0-flash is the latest stable model for V2
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
};

export const analyzeTaskWithAI = async (taskText, domain, apiKey) => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        const model = getModel(apiKey);

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

        if (!text) throw new Error("No response from AI");

        // Clean javascript markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("AI Analysis failed", e);
        // SDK throws specific errors, we can pass them validation
        if (e.message?.includes('429')) {
            throw new Error("Rate limit exceeded. Please wait a moment.");
        }
        throw new Error(e.message || "AI Analysis failed");
    }
};

export const optimizeScheduleWithAI = async (tasks, startTime, apiKey) => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        const model = getModel(apiKey);

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

        if (!text) throw new Error("No response from AI");

        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("AI Optimization failed", e);
        if (e.message?.includes('429')) {
            throw new Error("Rate limit exceeded. Please wait a moment.");
        }
        throw new Error(e.message || "Schedule optimization failed");
    }
};
