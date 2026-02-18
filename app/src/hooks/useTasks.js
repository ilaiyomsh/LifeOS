import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as localDb from '../lib/localDb';

export function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetchTasks();
  }, [fetchTasks]);

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
    // Check if it's a recurring task — auto-create next instance
    const task = tasks.find((t) => t.id === id);
    if (task?.recurring_rule) {
      const rule = task.recurring_rule;
      const nextDate = new Date();
      if (rule.frequency === 'daily') nextDate.setDate(nextDate.getDate() + (rule.interval || 1));
      else if (rule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7 * (rule.interval || 1));
      else if (rule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + (rule.interval || 1));

      await addTask({
        title: task.title,
        notes: task.notes,
        status: 'next_action',
        priority: task.priority,
        area: task.area,
        project_id: task.project_id,
        estimated_minutes: task.estimated_minutes,
        tags: task.tags,
        recurring_rule: task.recurring_rule,
        scheduled_date: nextDate.toISOString().split('T')[0],
      });
    }
    return updateTask(id, { status: 'done', completed_at: new Date().toISOString() });
  }, [updateTask, addTask, tasks]);

  return { tasks, loading, error, addTask, updateTask, deleteTask, completeTask, refresh: fetchTasks };
}
