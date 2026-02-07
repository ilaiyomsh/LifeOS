import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as localDb from '../lib/localDb';

export function useEvents(from, to) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  const fetchEvents = useCallback(() => {
    if (!supabase) {
      setEvents(localDb.getEvents(from, to));
      setLoading(false);
      return;
    }

    (async () => {
      let query = supabase.from('events').select('*');

      if (from) query = query.gte('start_at', from);
      if (to) query = query.lte('start_at', to);

      query = query.order('start_at');

      const { data } = await query;
      setEvents(data || []);
      setLoading(false);
    })();
  }, [from, to]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchEvents(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  });

  useEffect(() => {
    if (supabase) {
      // No realtime channel for events was set up before, keep it simple
      return;
    }
    return localDb.subscribe('events', fetchEvents);
  }, [fetchEvents]);

  const addEvent = useCallback(async (eventData) => {
    if (!supabase) return localDb.addEvent(eventData);

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }, []);

  const updateEvent = useCallback(async (id, updates) => {
    if (!supabase) return localDb.updateEvent(id, updates);

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    if (!supabase) return localDb.deleteEvent(id);

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }, []);

  return { events, loading, addEvent, updateEvent, deleteEvent, refresh: fetchEvents };
}
