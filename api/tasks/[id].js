import { getSupabase, cors } from '../_supabase.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const db = getSupabase();

  if (req.method === 'PATCH') {
    const updates = {};
    const allowed = ['title', 'notes', 'status', 'priority', 'area', 'project_id', 'due_date', 'scheduled_date', 'estimated_minutes', 'waiting_on', 'completed_at', 'position'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await db.from('tasks').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { data, error } = await db.from('tasks').update({ status: 'trashed' }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
