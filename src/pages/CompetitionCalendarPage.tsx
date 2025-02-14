import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Save, Plus, Trash2, Calendar, MapPin, Clock, Users, FileText, AlertTriangle, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../types';

const eventTypes = [
  { id: 'fixed-rod', label: 'Vaste Stok' },
  { id: 'feeder', label: 'Feeder' },
  { id: 'open', label: 'Open' },
  { id: 'open-float', label: 'Open Dobber' }
];

const accessTypes = [
  { id: 'members-only', label: 'Alleen leden' },
  { id: 'public', label: 'Openbaar' }
];

const countries = [
  { code: 'BE', name: 'België' },
  { code: 'NL', name: 'Nederland' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'GB', name: 'Engeland' },
  { code: 'LU', name: 'Luxemburg' }
];

export function CompetitionCalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading events');
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = () => {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      user_id: '',
      date: new Date().toISOString().split('T')[0],
      name: '',
      type: 'fixed-rod',
      access: 'members-only',
      number_pickup_time: '08:00',
      start_time: '09:00',
      end_time: '12:00',
      break_duration: 0,
      postal_code: '',
      city: '',
      country: 'BE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Validate events
      const invalidEvent = events.find(event => !event.name || !event.date);
      if (invalidEvent) {
        setError('Vul voor alle wedstrijden een naam en datum in');
        return;
      }

      // Prepare events with user_id
      const eventsWithUser = events.map(event => ({
        ...event,
        user_id: user.id
      }));

      // Get existing events
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', user.id);

      const existingIds = new Set((existingEvents || []).map(e => e.id));
      const newEvents = eventsWithUser.filter(e => !existingIds.has(e.id));
      const updatedEvents = eventsWithUser.filter(e => existingIds.has(e.id));
      const deletedIds = Array.from(existingIds).filter(id => 
        !eventsWithUser.some(e => e.id === id)
      );

      // Delete removed events
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .in('id', deletedIds);

        if (deleteError) throw deleteError;
      }

      // Insert new events
      if (newEvents.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert(newEvents);

        if (insertError) throw insertError;
      }

      // Update existing events
      for (const event of updatedEvents) {
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update(event)
          .eq('id', event.id);

        if (updateError) throw updateError;
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving events');
      console.error('Error saving events:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/kalender')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Home size={20} />
          Terug naar kalender
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={addEvent}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 border-2 border-blue-600 rounded-md transition-colors"
          >
            <Plus size={20} />
            Nieuwe wedstrijd
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Save size={20} />
            Opslaan
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Wedstrijdkalender</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {showSaveSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg">
          Kalender succesvol opgeslagen!
        </div>
      )}

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="border rounded-lg p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam wedstrijd
                </label>
                <input
                  type="text"
                  value={event.name}
                  onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Naam van de wedstrijd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type wedstrijd
                </label>
                <select
                  value={event.type}
                  onChange={(e) => updateEvent(event.id, { type: e.target.value as CalendarEvent['type'] })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {eventTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toegang
                </label>
                <select
                  value={event.access}
                  onChange={(e) => updateEvent(event.id, { access: e.target.value as CalendarEvent['access'] })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accessTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loting
                </label>
                <input
                  type="time"
                  value={event.number_pickup_time}
                  onChange={(e) => updateEvent(event.id, { number_pickup_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start tijd
                </label>
                <input
                  type="time"
                  value={event.start_time}
                  onChange={(e) => updateEvent(event.id, { start_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eind tijd
                </label>
                <input
                  type="time"
                  value={event.end_time}
                  onChange={(e) => updateEvent(event.id, { end_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pauze (minuten)
                </label>
                <input
                  type="number"
                  value={event.break_duration}
                  onChange={(e) => updateEvent(event.id, { break_duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={event.postal_code}
                  onChange={(e) => updateEvent(event.id, { postal_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Postcode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stad
                </label>
                <input
                  type="text"
                  value={event.city}
                  onChange={(e) => updateEvent(event.id, { city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Stad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land
                </label>
                <select
                  value={event.country}
                  onChange={(e) => updateEvent(event.id, { country: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => removeEvent(event.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={20} />
                Verwijder wedstrijd
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}