import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as localDb from '../lib/localDb';

export function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const { status: fStatus, area: fArea, project_id: fProjectId, scheduled_date: fScheduledDate } = filters;

  const fetchTasks = useCallback(() => {
    const activeFilters = { status: fStatus, area: fArea, project_id: fProjectId, scheduled_date: fScheduledDate };

    if (!supabase) {
      setTasks(localDb.getTasks(activeFilters));
      setLoading(false);
      return;
    }

    (async () => {
      let query = supabase.from('tasks').select('*');

      if (fStatus) {
        const statuses = Array.isArray(fStatus) ? fStatus : [fStatus];
        query = query.in('status', statuses);
      }
      if (fArea) query = query.eq('area', fArea);
      if (fProjectId) query = query.eq('project_id', fProjectId);
      if (fScheduledDate) query = query.eq('scheduled_date', fScheduledDate);

      query = query.neq('status', 'trashed').order('position').order('created_at', { ascending: false });

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
        setTasks([]);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    })();
  }, [fStatus, fArea, fProjectId, fScheduledDate]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchTasks(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  });

  // Realtime: Supabase channel or localStorage event listener
  useEffect(() => {
    if (supabase) {
      const channel = supabase
        .channel('tasks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          fetchTasks();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    // localStorage reactivity
    return localDb.subscribe('tasks', fetchTasks);
  }, [fetchTasks]);

  const addTask = useCallback(async (taskData) => {
    if (!supabase) return localDb.addTask(taskData);

    const { data, error: err } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    if (!supabase) return localDb.updateTask(id, updates);

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
    if (!supabase) return localDb.deleteTask(id);

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
