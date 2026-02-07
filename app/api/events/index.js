import { getSupabase, cors } from '../_supabase.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getSupabase();

  if (req.method === 'GET') {
    const { from, to } = req.query;
    let query = db.from('events').select('*');

    if (from) query = query.gte('start_at', from);
    if (to) query = query.lte('start_at', to);

    query = query.order('start_at');

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, area, start_at, end_at, is_all_day, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!start_at) {
      return res.status(400).json({ error: 'start_at is required' });
    }

    const event = {
      title: title.trim(),
      area: area || null,
      start_at,
      end_at: end_at || null,
      is_all_day: is_all_day || false,
      notes: notes || null,
    };

    const { data, error } = await db.from('events').insert([event]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
