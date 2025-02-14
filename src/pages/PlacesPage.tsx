import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, FileSpreadsheet, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useParticipantsStore } from '../store/participantsStore';
import { useCompetitionStore } from '../store/competitionStore';
import { useSavedResultsStore } from '../store/savedResultsStore';
import { PlacesPDF } from '../components/PlacesPDF';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { SaveSuccessMessage } from '../components/SaveSuccessMessage';

export function PlacesPage() {
  const navigate = useNavigate();
  const { participants, updateParticipant, sectorSizes: storeSectorSizes, setSectorSizes, hasUnsavedChanges, setHasUnsavedChanges } = useParticipantsStore();
  const { details } = useCompetitionStore();
  const { addCompetition, findExistingCompetition } = useSavedResultsStore();
  const [localSectorSizes, setLocalSectorSizes] = useState<(number | null)[]>(storeSectorSizes.map(() => null));
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<{ id: number; place: number; existingParticipant: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize local sector sizes from store
  useEffect(() => {
    setLocalSectorSizes(storeSectorSizes.map(size => size || null));
  }, [storeSectorSizes]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleNavigation = (to: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation(to);
    } else {
      navigate(to);
    }
  };

  const sectors = localSectorSizes.map((_, index) => String.fromCharCode(65 + index));

  const getSector = (placeNumber: number) => {
    if (!placeNumber) return '';
    let currentPosition = 0;
    for (let i = 0; i < localSectorSizes.length; i++) {
      currentPosition += localSectorSizes[i] || 0;
      if (placeNumber <= currentPosition) {
        return String.fromCharCode(65 + i);
      }
    }
    return '';
  };

  const isPlaceNumberTaken = (place: number, currentParticipantId: number) => {
    const existingParticipant = participants.find(p => p.place === place && p.id !== currentParticipantId);
    return existingParticipant ? existingParticipant.name : null;
  };

  const validateAndUpdatePlace = (participantId: number, place: string) => {
    const placeNumber = parseInt(place, 10);
    
    if (placeNumber) {
      const existingParticipant = isPlaceNumberTaken(placeNumber, participantId);
      if (existingParticipant) {
        setDuplicateError({ 
          id: participantId, 
          place: placeNumber,
          existingParticipant
        });
        return false;
      }
    }
    
    setDuplicateError(null);
    updateParticipant(participantId, { place: placeNumber || undefined });
    return true;
  };

  const handleKeyPress = (event: React.KeyboardEvent, currentIndex: number, participantId: number, currentValue: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (validateAndUpdatePlace(participantId, currentValue)) {
        const nextInput = document.querySelector(`[data-place-index="${currentIndex + 1}"]`) as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const handleBlur = (participantId: number, place: string) => {
    validateAndUpdatePlace(participantId, place);
  };

  const addSector = () => {
    setLocalSectorSizes([...localSectorSizes, null]);
    setHasUnsavedChanges(true);
  };

  const updateSectorSize = (index: number, value: string) => {
    const newSizes = [...localSectorSizes];
    newSizes[index] = value === '' ? null : parseInt(value, 10);
    setLocalSectorSizes(newSizes);
    setHasUnsavedChanges(true);
  };

  const removeSector = (index: number) => {
    setLocalSectorSizes(localSectorSizes.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!details) {
      setError('Wedstrijd details ontbreken');
      return;
    }

    // Check if all participants have a place number
    const participantsWithoutPlace = participants.filter(p => !p.place);
    if (participantsWithoutPlace.length > 0) {
      setError(`Niet alle deelnemers hebben een plaatsnummer. ${participantsWithoutPlace[0].name} heeft nog geen nummer.`);
      
      // Scroll to the first participant without a place number
      const element = document.querySelector(`[data-participant="${participantsWithoutPlace[0].id}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check if sector sizes are valid
    const invalidSectors = localSectorSizes.some(size => size === null || size <= 0);
    if (invalidSectors) {
      setError('Vul voor elke sector een geldig aantal deelnemers in');
      return;
    }

    try {
      // Convert null values to default value of 10
      const validSectorSizes = localSectorSizes.map(size => size || 10);
      setSectorSizes(validSectorSizes);

      // Save to Supabase if this is an existing competition
      const existingCompetition = findExistingCompetition(details.name, details.date, details.location);
      if (existingCompetition) {
        await addCompetition({
          ...existingCompetition,
          participants,
          sectorSizes: validSectorSizes
        });
      }

      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      setError(null);

      // Navigate to weighing page after a short delay
      setTimeout(() => {
        navigate('/weging');
      }, 1000);
    } catch (err) {
      setError('Er is een fout opgetreden bij het opslaan van de gegevens.');
      console.error('Error saving places:', err);
    }
  };

  const getSortedParticipants = () => {
    return [...participants].sort((a, b) => {
      const aPlace = a.place || Infinity;
      const bPlace = b.place || Infinity;
      return aPlace - bPlace;
    });
  };

  const exportToExcel = () => {
    const data = getSortedParticipants().map(p => ([
      p.place || '-',
      getSector(p.place || 0),
      p.name
    ]));

    const ws = utils.aoa_to_sheet([
      ['Nummer', 'Sector', 'Naam'],
      ...data
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Plaatsnummers');
    writeFile(wb, 'plaatsnummers.xlsx');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => handleNavigation('/deelnemers')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          Vorige
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Plaatsnummers</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <h3 className="text-xl font-semibold mb-4">Sector Indeling</h3>
        <div className="space-y-4">
          {localSectorSizes.map((size, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-700">
                Sector {String.fromCharCode(65 + index)}:
              </span>
              <input
                type="number"
                min="1"
                value={size === null ? '' : size}
                onChange={(e) => updateSectorSize(index, e.target.value)}
                className="w-36 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="vul aantal in"
              />
              <span className="text-sm text-gray-600">deelnemers</span>
              {index > 0 && (
                <button
                  onClick={() => removeSector(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Verwijder
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addSector}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          + Voeg sector toe
        </button>
      </div>

      <div className="space-y-4">
        {participants.map((participant, index) => (
          <div 
            key={participant.id} 
            className="flex gap-4 p-4 border rounded-lg bg-gray-50 items-center"
            data-participant={participant.id}
          >
            <span className="font-bold text-lg w-12">{participant.id}.</span>
            <span className="w-80">{participant.name}</span>
            <div className="flex items-center gap-4">
              <span className="w-20 text-center font-semibold">
                {participant.place ? getSector(participant.place) : '-'}
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={participant.place || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      updateParticipant(participant.id, { place: undefined });
                      setDuplicateError(null);
                    } else {
                      const num = parseInt(value, 10);
                      if (!isNaN(num)) {
                        validateAndUpdatePlace(participant.id, value);
                      }
                    }
                  }}
                  onBlur={(e) => handleBlur(participant.id, e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, index, participant.id, e.currentTarget.value)}
                  placeholder="Nr"
                  className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    duplicateError?.id === participant.id ? 'border-red-500 ring-2 ring-red-200' : ''
                  }`}
                  data-place-index={index}
                />
                {duplicateError?.id === participant.id && (
                  <div className="absolute left-0 top-full mt-1 w-72 p-2 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-1 z-10">
                    <AlertTriangle size={14} />
                    <span>
                      Nummer {duplicateError.place} is al toegewezen aan {duplicateError.existingParticipant}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 border-2 border-green-600 rounded-md transition-colors"
          >
            <FileSpreadsheet size={20} />
            Excel
          </button>
          <PDFDownloadLink
            document={<PlacesPDF participants={getSortedParticipants()} getSector={getSector} competition={details || undefined} />}
            fileName="plaatsnummers.pdf"
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
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            <Save size={24} />
            Opslaan en verder
          </button>
        </div>
        {showSaveSuccess && (
          <SaveSuccessMessage 
            show={showSaveSuccess} 
            onHide={() => setShowSaveSuccess(false)} 
          />
        )}
      </div>

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          setHasUnsavedChanges(false);
          if (pendingNavigation) {
            navigate(pendingNavigation);
          }
        }}
      />
    </div>
  );
}