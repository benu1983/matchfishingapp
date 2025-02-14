import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompetitionStore } from '../store/competitionStore';
import { useParticipantsStore } from '../store/participantsStore';
import type { SavedCompetition } from '../types';

export function WeighingAccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setDetails } = useCompetitionStore();
  const { setParticipants, setSectorSizes } = useParticipantsStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        const accessId = searchParams.get('access');
        if (!accessId) {
          throw new Error('Geen toegangslink gevonden');
        }

        // Get access link details
        const { data: accessLink, error: accessError } = await supabase
          .from('weighing_access_links')
          .select('*, saved_competitions(*)')
          .eq('id', accessId)
          .single();

        if (accessError) throw accessError;
        if (!accessLink) throw new Error('Ongeldige toegangslink');

        // Check if link has expired
        if (new Date(accessLink.expires_at) < new Date()) {
          throw new Error('Deze toegangslink is verlopen');
        }

        // Get user email
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) throw new Error('Gebruiker niet gevonden');

        // Check if user has access
        if (accessLink.email !== user.email) {
          throw new Error('U heeft geen toegang tot deze weging');
        }

        // Transform competition data
        const competition = accessLink.saved_competitions as SavedCompetition;
        if (!competition) throw new Error('Wedstrijd niet gevonden');

        // Set competition details and participants
        setDetails({
          name: competition.name,
          date: competition.date,
          location: competition.location,
          type: competition.type,
          criteriumFolderId: competition.criteriumFolderId
        });
        setParticipants(competition.participants);
        setSectorSizes(competition.sectorSizes);

        // Navigate to weighing page
        navigate('/weging');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      } finally {
        setIsLoading(false);
      }
    };

    validateAccess();
  }, [searchParams, navigate, setDetails, setParticipants, setSectorSizes]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Toegang controleren...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-semibold">Toegang geweigerd</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Terug naar start
          </button>
        </div>
      </div>
    );
  }

  return null;
}