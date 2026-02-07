import { getSupabase, cors } from '../_supabase.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getSupabase();

  if (req.method === 'GET') {
    const { area, is_active } = req.query;
    let query = db.from('projects').select('*');

    if (area) query = query.eq('area', area);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, area, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!area) {
      return res.status(400).json({ error: 'area is required' });
    }

    const project = {
      title: title.trim(),
      area,
      description: description || null,
    };

    const { data, error } = await db.from('projects').insert([project]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
