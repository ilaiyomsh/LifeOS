export const analyzeTaskWithAI = async (taskText, domain) => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                taskText,
                domain
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            
            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please wait a moment.");
            }
            
            if (response.status === 500) {
                throw new Error(errorData.error || "Server error. Please try again later.");
            }
            
            throw new Error(errorData.error || "AI Analysis failed");
        }

        const data = await response.json();
        return data;

    } catch (e) {
        console.error("AI Analysis failed", e);
        
        // Handle network errors
        if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
            throw new Error("Cannot connect to server. Please check your connection.");
        }
        
        throw new Error(e.message || "AI Analysis failed");
    }
};

export const optimizeScheduleWithAI = async (tasks, startTime) => {
    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tasks,
                startTime
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            
            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please wait a moment.");
            }
            
            if (response.status === 500) {
                throw new Error(errorData.error || "Server error. Please try again later.");
            }
            
            throw new Error(errorData.error || "Schedule optimization failed");
        }

        const data = await response.json();
        return data;

    } catch (e) {
        console.error("AI Optimization failed", e);
        
        // Handle network errors
        if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
            throw new Error("Cannot connect to server. Please check your connection.");
        }
        
        throw new Error(e.message || "Schedule optimization failed");
    }
};
