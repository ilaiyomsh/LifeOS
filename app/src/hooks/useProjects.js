import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const fetchProjects = useCallback(async () => {
    let query = supabase.from('projects').select('*');

    if (filters.area) query = query.eq('area', filters.area);
    if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);

    query = query.order('created_at', { ascending: false });

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
      setProjects([]);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [filters.area, filters.is_active]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchProjects(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  const addProject = useCallback(async (projectData) => {
    const { data, error: err } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    if (updates.is_active === false && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    const { data, error: err } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }, []);

  return { projects, loading, error, addProject, updateProject, refresh: fetchProjects };
}
