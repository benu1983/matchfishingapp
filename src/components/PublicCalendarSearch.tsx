import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Calendar, AlertTriangle, Filter, Clock, Building2, 
  Phone, Mail, Globe2, FileText, Facebook, Instagram, Twitter, Youtube, 
  Linkedin 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, RodType, CompetitionFormat, WaterType } from '../types';

const rodTypes: { id: RodType; label: string }[] = [
  { id: 'fixed-rod', label: 'Vaste Stok' },
  { id: 'feeder', label: 'Feeder' },
  { id: 'open', label: 'Open' },
  { id: 'open-float', label: 'Open Dobber' }
];

const waterTypes: { id: WaterType; label: string }[] = [
  { id: 'public', label: 'Openbaar' },
  { id: 'bream-pond', label: 'Brasem vijver' },
  { id: 'carp-pond', label: 'Karper vijver' },
  { id: 'allround-pond', label: 'Allround vijver' }
];

const competitionFormats: { id: CompetitionFormat; label: string }[] = [
  { id: 'single', label: 'Individueel' },
  { id: 'pair', label: 'Koppel' },
  { id: 'trio', label: 'Trio' },
  { id: 'other', label: 'Anders' }
];

interface Coordinates {
  lat: number;
  lon: number;
}

interface ClubDetails {
  name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  phone_numbers: { countryCode: string; number: string }[];
  social_media: { platform: string; url: string }[];
  rules_file_url?: string;
  website?: string;
  email?: string;
  public_name: boolean;
  public_address: boolean;
  public_phone: boolean;
  public_rules: boolean;
  public_website: boolean;
  public_email: boolean;
  public_social_media: boolean;
}

interface ClubDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function ClubDetailsDialog({ isOpen, onClose, userId }: ClubDetailsDialogProps) {
  const [clubDetails, setClubDetails] = useState<ClubDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const countries = {
    'BE': 'België',
    'NL': 'Nederland',
    'DE': 'Duitsland',
    'FR': 'Frankrijk',
    'GB': 'Engeland',
    'LU': 'Luxemburg'
  };

  const socialMediaIcons = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadClubDetails();
    }
  }, [isOpen, userId]);

  const loadClubDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('club_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setClubDetails(data);
    } catch (err) {
      console.error('Error loading club details:', err);
      setError('Er is een fout opgetreden bij het laden van de club gegevens');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Club gegevens</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-gray-600">
            Laden...
          </div>
        ) : !clubDetails ? (
          <div className="text-center py-8 text-gray-600">
            Geen club gegevens gevonden
          </div>
        ) : (
          <div className="space-y-6">
            {clubDetails.public_address && (
              <div className="space-y-2">
                {clubDetails.street && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={20} className="flex-shrink-0 mt-1" />
                    <div>
                      <div>{clubDetails.street}</div>
                      <div>{clubDetails.postal_code} {clubDetails.city}</div>
                      <div>{countries[clubDetails.country as keyof typeof countries]}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {clubDetails.public_phone && clubDetails.phone_numbers && clubDetails.phone_numbers.length > 0 && (
              <div className="space-y-2">
                {clubDetails.phone_numbers.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-600">
                    <Phone size={20} />
                    <span>{phone.countryCode} {phone.number}</span>
                  </div>
                ))}
              </div>
            )}

            {clubDetails.public_email && clubDetails.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={20} />
                <a 
                  href={`mailto:${clubDetails.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {clubDetails.email}
                </a>
              </div>
            )}

            {clubDetails.public_website && clubDetails.website && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe2 size={20} />
                <a 
                  href={clubDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Website
                </a>
              </div>
            )}

            {clubDetails.public_rules && clubDetails.rules_file_url && (
              <div className="flex items-center gap-2 text-gray-600">
                <FileText size={20} />
                <a 
                  href={clubDetails.rules_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Club reglement
                </a>
              </div>
            )}

            {clubDetails.public_social_media && clubDetails.social_media && clubDetails.social_media.length > 0 && (
              <div className="flex gap-3">
                {clubDetails.social_media.map((social, index) => {
                  const Icon = socialMediaIcons[social.platform as keyof typeof socialMediaIcons];
                  if (!Icon) return null;
                  
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicCalendarSearch() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubNames, setClubNames] = useState<Record<string, string>>({});

  // Filter states
  const [selectedRodType, setSelectedRodType] = useState<RodType | ''>('');
  const [selectedWaterType, setSelectedWaterType] = useState<WaterType | ''>('');
  const [selectedFormat, setSelectedFormat] = useState<CompetitionFormat | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState<string>('25');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Check if any search criteria is set (excluding distance)
  const hasSearchCriteria = () => {
    return selectedRodType !== '' ||
           selectedWaterType !== '' ||
           selectedFormat !== '' ||
           startDate !== '' ||
           endDate !== '' ||
           location.trim() !== '';
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('access', 'public')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Load club details for all unique user_ids
      const userIds = [...new Set(eventsData?.map(event => event.user_id) || [])];
      const { data: clubData, error: clubError } = await supabase
        .from('club_details')
        .select('user_id, name, public_name')
        .in('user_id', userIds);

      if (clubError) throw clubError;

      // Create a map of user_id to club name for public clubs
      const clubNameMap = clubData?.reduce((acc, club) => {
        if (club.public_name) {
          acc[club.user_id] = club.name;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      setClubNames(clubNameMap);
      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Er is een fout opgetreden bij het laden van de wedstrijden');
    } finally {
      setIsLoading(false);
    }
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

  const handleLocationChange = async (value: string) => {
    setLocation(value);
    if (value.trim()) {
      const coords = await getCoordinates(value);
      setCoordinates(coords);
    } else {
      setCoordinates(null);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (hasSearchCriteria()) {
      loadEvents();
    } else {
      setEvents([]);
      setFilteredEvents([]);
    }
  }, [selectedRodType, selectedWaterType, selectedFormat, startDate, endDate, location]);

  useEffect(() => {
    let filtered = [...events];

    // Filter by rod type
    if (selectedRodType) {
      filtered = filtered.filter(event => event.type === selectedRodType);
    }

    // Filter by water type
    if (selectedWaterType) {
      filtered = filtered.filter(event => event.water_type === selectedWaterType);
    }

    // Filter by format
    if (selectedFormat) {
      filtered = filtered.filter(event => event.format === selectedFormat);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(event => event.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(event => event.date <= endDate);
    }

    // Filter by distance
    const distanceValue = parseInt(distance);
    if (coordinates && distanceValue > 0) {
      filtered = filtered.filter(event => {
        if (!event.latitude || !event.longitude) return false;
        const dist = calculateDistance(
          coordinates.lat,
          coordinates.lon,
          event.latitude,
          event.longitude
        );
        return dist <= distanceValue;
      });
    }

    setFilteredEvents(filtered);
  }, [events, selectedRodType, selectedWaterType, selectedFormat, startDate, endDate, distance, coordinates]);

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Only show HH:mm
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Zoek wedstrijden</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type hengel
            </label>
            <select
              value={selectedRodType}
              onChange={(e) => setSelectedRodType(e.target.value as RodType | '')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle types</option>
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
              value={selectedWaterType}
              onChange={(e) => setSelectedWaterType(e.target.value as WaterType | '')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle types</option>
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
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as CompetitionFormat | '')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle types</option>
              {competitionFormats.map(format => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vanaf datum
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tot datum
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Afstand (km)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={distance}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setDistance(value);
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="25"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="Zoek op locatie (stad, postcode, adres)"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-600">
          Wedstrijden laden...
        </div>
      ) : !hasSearchCriteria() ? (
        <div className="text-center py-8 text-gray-600">
          Vul minimaal één zoekcriteria in om wedstrijden te zoeken
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Geen wedstrijden gevonden die aan de criteria voldoen
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg overflow-hidden"
            >
              <div className="p-4 bg-white">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      {clubNames[event.user_id] && (
                        <span className="text-gray-600 font-medium">
                          - {clubNames[event.user_id]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-gray-600">
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
                        {event.city}, {event.country}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {rodTypes.find(t => t.id === event.type)?.label}
                      </span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                        {competitionFormats.find(f => f.id === event.format)?.label}
                      </span>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                        {waterTypes.find(t => t.id === event.water_type)?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedClubId(event.user_id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Building2 size={16} />
                      Club details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClubDetailsDialog
        isOpen={selectedClubId !== null}
        onClose={() => setSelectedClubId(null)}
        userId={selectedClubId || ''}
      />
    </div>
  );
}