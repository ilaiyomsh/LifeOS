export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Missing required field: text' });
        }

        // NOTE: In a real app with a database, you would save the task here.
        // Since this app currently uses LocalStorage (client-side only),
        // an API endpoint cannot directly update the user's browser storage.
        
        // This endpoint serves as the "Inbox Entry Point" for external integrations
        // (like iOS Shortcuts, Webhooks, etc.)
        
        const newTask = {
            id: Date.now(),
            text,
            domain: null, // Inbox tasks have no domain yet
            importance: 3,
            urgency: 3,
            deadline: null,
            type: 'task',
            createdAt: new Date().toISOString()
        };

        // For now, we return the task. To make this work, the frontend would need 
        // to poll an API or use a real-time DB (like Supabase/Firebase).
        return res.status(200).json({ 
            success: true, 
            message: 'Task received in inbox',
            task: newTask 
        });

    } catch (error) {
        console.error("Inbox endpoint failed", error);
        return res.status(500).json({ 
            error: error.message || 'Failed to process inbox task' 
        });
    }
}
