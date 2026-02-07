import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as localDb from '../lib/localDb';

export function useProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const { area: fArea, is_active: fIsActive } = filters;

  const fetchProjects = useCallback(() => {
    const activeFilters = { area: fArea, is_active: fIsActive };

    if (!supabase) {
      setProjects(localDb.getProjects(activeFilters));
      setLoading(false);
      return;
    }

    (async () => {
      let query = supabase.from('projects').select('*');

      if (fArea) query = query.eq('area', fArea);
      if (fIsActive !== undefined) query = query.eq('is_active', fIsActive);

      query = query.order('created_at', { ascending: false });

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    })();
  }, [fArea, fIsActive]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchProjects(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  });

  useEffect(() => {
    if (supabase) {
      const channel = supabase
        .channel('projects-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          fetchProjects();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return localDb.subscribe('projects', fetchProjects);
  }, [fetchProjects]);

  const addProject = useCallback(async (projectData) => {
    if (!supabase) return localDb.addProject(projectData);

    const { data, error: err } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    if (!supabase) return localDb.updateProject(id, updates);

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
