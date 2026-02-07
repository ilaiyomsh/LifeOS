import { getSupabase, cors } from '../_supabase.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const db = getSupabase();

  if (req.method === 'PATCH') {
    const updates = {};
    const allowed = ['title', 'area', 'description', 'is_active', 'completed_at'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.is_active === false && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await db.from('projects').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
