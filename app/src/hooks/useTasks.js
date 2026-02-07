import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const fetchTasks = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    let query = supabase.from('tasks').select('*');

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in('status', statuses);
    }
    if (filters.area) query = query.eq('area', filters.area);
    if (filters.project_id) query = query.eq('project_id', filters.project_id);
    if (filters.scheduled_date) query = query.eq('scheduled_date', filters.scheduled_date);

    query = query.neq('status', 'trashed').order('position').order('created_at', { ascending: false });

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
      setTasks([]);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [filters.status, filters.area, filters.project_id, filters.scheduled_date]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchTasks(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  });

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const addTask = useCallback(async (taskData) => {
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    if (!supabase) return;
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    const { data, error: err } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }, []);

  const deleteTask = useCallback(async (id) => {
    if (!supabase) return;
    const { error: err } = await supabase
      .from('tasks')
      .update({ status: 'trashed' })
      .eq('id', id);

    if (err) throw new Error(err.message);
  }, []);

  const completeTask = useCallback(async (id) => {
    return updateTask(id, { status: 'done', completed_at: new Date().toISOString() });
  }, [updateTask]);

  return { tasks, loading, error, addTask, updateTask, deleteTask, completeTask, refresh: fetchTasks };
}
