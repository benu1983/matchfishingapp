import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Save, Plus, Trash2, Calendar, MapPin, Clock, FileText, AlertTriangle, Pencil, Upload, X, Eye, FileSpreadsheet, Download, Globe, AlertCircle, Copy
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { CalendarPDF } from '../components/CalendarPDF';
import { ImportCalendarDialog } from '../components/ImportCalendarDialog';
import { BulkEditDialog } from '../components/BulkEditDialog';
import type { CalendarEvent, RodType, CompetitionFormat, AccessType, WaterType } from '../types';

const rodTypes: { id: RodType; label: string }[] = [
  { id: 'fixed-rod', label: 'Vaste Stok' },
  { id: 'feeder', label: 'Feeder' },
  { id: 'open', label: 'Open' },
  { id: 'open-float', label: 'Open Dobber' }
];

const competitionFormats: { id: CompetitionFormat; label: string }[] = [
  { id: 'single', label: 'Individueel' },
  { id: 'pair', label: 'Koppel' },
  { id: 'trio', label: 'Trio' },
  { id: 'other', label: 'Anders' }
];

const accessTypes: { id: AccessType; label: string }[] = [
  { id: 'members-only', label: 'Alleen leden' },
  { id: 'public', label: 'Openbaar' }
];

const waterTypes: { id: WaterType; label: string }[] = [
  { id: 'public', label: 'Openbaar' },
  { id: 'bream-pond', label: 'Brasem vijver' },
  { id: 'carp-pond', label: 'Karper vijver' },
  { id: 'allround-pond', label: 'Allround vijver' }
];

const countries = [
  { code: 'BE', name: 'België' },
  { code: 'NL', name: 'Nederland' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'GB', name: 'Engeland' },
  { code: 'LU', name: 'Luxemburg' }
];

const formatTime = (time: string) => {
  return time.substring(0, 5); // Only show HH:mm
};

const getRodTypeLabel = (type: RodType) => {
  return rodTypes.find(t => t.id === type)?.label || type;
};

const getFormatLabel = (format: CompetitionFormat) => {
  return competitionFormats.find(f => f.id === format)?.label || format;
};

const getAccessLabel = (access: AccessType) => {
  return accessTypes.find(a => a.id === access)?.label || access;
};

const getWaterTypeLabel = (type: WaterType) => {
  return waterTypes.find(t => t.id === type)?.label || type;
};

const getCoordinates = async (address: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox access token is missing');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?` +
      `access_token=${mapboxToken}` +
      `&limit=1` +
      `&types=address,place,postcode`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].center;
      return { lat, lon };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

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

  const createNewEvent = () => {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      name: '',
      type: 'fixed-rod',
      format: 'single',
      access: 'members-only',
      water_type: 'public',
      number_pickup_time: '08:00',
      start_time: '09:00',
      end_time: '12:00',
      postal_code: '',
      city: '',
      country: 'BE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSelectedEvent(newEvent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const address = `${selectedEvent.postal_code} ${selectedEvent.city}, ${selectedEvent.country}`;
      const coordinates = await getCoordinates(address);

      const eventData = {
        ...selectedEvent,
        user_id: user.id,
        latitude: coordinates?.lat,
        longitude: coordinates?.lon,
        updated_at: new Date().toISOString()
      };

      if (events.find(e => e.id === selectedEvent.id)) {
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', selectedEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .insert([eventData]);

        if (error) throw error;
      }

      loadEvents();
      setIsEditing(false);
      setSelectedEvent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving event');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting event');
    }
  };

  const handleBulkEdit = async (updates: {
    type?: RodType;
    format?: CompetitionFormat;
    water_type?: WaterType;
    access?: AccessType;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('calendar_events')
        .update({
          ...updates,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedEventIds));

      if (error) throw error;

      setEvents(events.map(event => 
        selectedEventIds.has(event.id) 
          ? { ...event, ...updates, is_edited: true }
          : event
      ));

      setShowBulkEditDialog(false);
      setSelectedEventIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating events');
    }
  };

  const handleDuplicate = (event: CalendarEvent) => {
    const duplicatedEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      name: `${event.name} (kopie)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEvents([...events, duplicatedEvent]);
  };

  const exportToExcel = () => {
    const data = events.map(event => ({
      'Datum': new Date(event.date).toLocaleDateString('nl-NL'),
      'Naam': event.name,
      'Type hengel': getRodTypeLabel(event.type),
      'Type wedstrijd': getFormatLabel(event.format),
      'Type water': getWaterTypeLabel(event.water_type),
      'Toegang': getAccessLabel(event.access),
      'Tijd afhaling nummers': formatTime(event.number_pickup_time),
      'Start uur': formatTime(event.start_time),
      'Eind uur': formatTime(event.end_time),
      'Postcode': event.postal_code,
      'Stad': event.city,
      'Land': countries.find(c => c.code === event.country)?.name || event.country
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Kalender');
    writeFile(wb, 'wedstrijdkalender.xlsx');
  };

  const handleImport = async (importedEvents: Partial<CalendarEvent>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Process events sequentially to respect rate limits
      const eventsWithCoordinates = [];
      for (const event of importedEvents) {
        const address = `${event.postal_code} ${event.city}, ${event.country}`;
        const coordinates = await getCoordinates(address);
        
        eventsWithCoordinates.push({
          ...event,
          user_id: user.id,
          is_imported: true,
          is_edited: false,
          latitude: coordinates?.lat,
          longitude: coordinates?.lon,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const { error } = await supabase
        .from('calendar_events')
        .insert(eventsWithCoordinates);

      if (error) throw error;

      loadEvents();
      setShowImportDialog(false);
    } catch (err) {
      setError('Er is een fout opgetreden bij het importeren van de wedstrijden');
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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Home size={20} />
          Terug naar start
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 border-2 border-blue-600 rounded-md transition-colors"
          >
            <Upload size={20} />
            Importeer Excel
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 border-2 border-green-600 rounded-md transition-colors"
          >
            <FileSpreadsheet size={20} />
            Excel
          </button>
          <PDFDownloadLink
            document={<CalendarPDF events={events} />}
            fileName="wedstrijdkalender.pdf"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 border-2 border-red-600 rounded-md transition-colors"
          >
            {({ loading }) => (
              <>
                <FileText size={20} />
                {loading ? 'Laden...' : 'PDF'}
              </>
            )}
          </PDFDownloadLink>
          <button
            onClick={createNewEvent}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nieuwe wedstrijd
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Kalender</h2>

      {selectedEventIds.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-blue-600">
            {selectedEventIds.size} wedstrijd{selectedEventIds.size === 1 ? '' : 'en'} geselecteerd
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedEventIds(new Set())}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
            >
              <X size={16} />
              Selectie wissen
            </button>
            <button
              onClick={() => setShowBulkEditDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Pencil size={16} />
              Bewerk selectie
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen wedstrijden gevonden
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors ${
                selectedEventIds.has(event.id) ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEventIds.has(event.id)}
                      onChange={() => {
                        const newSelection = new Set(selectedEventIds);
                        if (newSelection.has(event.id)) {
                          newSelection.delete(event.id);
                        } else {
                          newSelection.add(event.id);
                        }
                        setSelectedEventIds(newSelection);
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="sr-only">Selecteer wedstrijd</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <div className="flex items-center gap-2">
                        {event.access === 'public' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                            <Globe size={14} />
                            <span>Openbaar zichtbaar</span>
                          </div>
                        )}
                        {event.is_imported && !event.is_edited && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                            <AlertCircle size={14} />
                            <span>Nog niet gecontroleerd</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(event.date).toLocaleDateString('nl-NL')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {event.city}, {countries.find(c => c.code === event.country)?.name}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {getRodTypeLabel(event.type)}
                      </span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                        {getFormatLabel(event.format)}
                      </span>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                        {getAccessLabel(event.access)}
                      </span>
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-sm">
                        {getWaterTypeLabel(event.water_type)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDuplicate(event)}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Dupliceer wedstrijd"
                  >
                    <Copy size={16} />
                    Dupliceer
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent({
                        ...event,
                        is_edited: true
                      });
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Pencil size={16} />
                    Bewerk
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                    Verwijder
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isEditing && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 my-4 md:my-8">
            <div className="sticky top-0 bg-white px-4 py-3 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {selectedEvent.id ? 'Bewerk wedstrijd' : 'Nieuwe wedstrijd'}
                </h2>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam
                  </label>
                  <input
                    type="text"
                    value={selectedEvent.name}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={selectedEvent.date}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type hengel
                  </label>
                  <select
                    value={selectedEvent.type}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, type: e.target.value as RodType })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {rodTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type water
                  </label>
                  <select
                    value={selectedEvent.water_type}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, water_type: e.target.value as WaterType })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {waterTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type wedstrijd
                  </label>
                  <select
                    value={selectedEvent.format}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, format: e.target.value as CompetitionFormat })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {competitionFormats.map(format => (
                      <option key={format.id} value={format.id}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toegang
                  </label>
                  <select
                    value={selectedEvent.access}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, access: e.target.value as AccessType })}
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
                    Loting tijd
                  </label>
                  <input
                    type="time"
                    value={selectedEvent.number_pickup_time}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, number_pickup_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start tijd
                  </label>
                  <input
                    type="time"
                    value={selectedEvent.start_time}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, start_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eind tijd
                  </label>
                  <input
                    type="time"
                    value={selectedEvent.end_time}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, end_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={selectedEvent.postal_code}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stad
                  </label>
                  <input
                    type="text"
                    value={selectedEvent.city}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  <select
                    value={selectedEvent.country}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, country: e.target.value })}
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

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImportCalendarDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
      />

      <BulkEditDialog
        isOpen={showBulkEditDialog}
        onClose={() => setShowBulkEditDialog(false)}
        onSave={handleBulkEdit}
      />
    </div>
  );
}

export { CalendarPage }