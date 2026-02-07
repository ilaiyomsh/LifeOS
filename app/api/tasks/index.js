import { getSupabase, cors } from '../_supabase.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getSupabase();

  if (req.method === 'GET') {
    const { status, area, scheduled_date, project_id } = req.query;
    let query = db.from('tasks').select('*');

    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }
    if (area) query = query.eq('area', area);
    if (scheduled_date) query = query.eq('scheduled_date', scheduled_date);
    if (project_id) query = query.eq('project_id', project_id);

    query = query.neq('status', 'trashed').order('position').order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, notes, area, priority, project_id, due_date, scheduled_date, estimated_minutes, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const task = {
      title: title.trim(),
      notes: notes || null,
      status: status || 'inbox',
      area: area || null,
      priority: priority || null,
      project_id: project_id || null,
      due_date: due_date || null,
      scheduled_date: scheduled_date || null,
      estimated_minutes: estimated_minutes || null,
    };

    const { data, error } = await db.from('tasks').insert([task]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
