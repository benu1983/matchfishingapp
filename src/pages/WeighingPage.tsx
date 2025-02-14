import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, FileSpreadsheet, FileText, AlertTriangle, UserPlus } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useParticipantsStore } from '../store/participantsStore';
import { useCompetitionStore } from '../store/competitionStore';
import { useSavedResultsStore } from '../store/savedResultsStore';
import { WeighingPDF } from '../components/WeighingPDF';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { SaveSuccessMessage } from '../components/SaveSuccessMessage';
import { WeighingAccessDialog } from '../components/WeighingAccessDialog';

export function WeighingPage() {
  const navigate = useNavigate();
  const { participants, updateParticipant, sectorSizes, hasUnsavedChanges, setHasUnsavedChanges } = useParticipantsStore();
  const { details } = useCompetitionStore();
  const { addCompetition, findExistingCompetition } = useSavedResultsStore();
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showWeighingAccessDialog, setShowWeighingAccessDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get sectors array based on sector sizes
  const sectors = Array.from({ length: sectorSizes.length }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  // Get the competition ID from the existing competition
  const existingCompetition = details ? findExistingCompetition(details.name, details.date, details.location) : undefined;
  const competitionId = existingCompetition?.id;

  // Sort participants by place number (undefined places at the end)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (!a.place && !b.place) return 0;
    if (!a.place) return 1;
    if (!b.place) return -1;
    return a.place - b.place;
  });

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

  const addWeight = (participantId: number) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      const currentWeights = participant.weights || [];
      const newWeightIndex = currentWeights.length;
      updateParticipant(participantId, {
        weights: [...currentWeights, null]
      });

      // Focus the new input field after it's added
      setTimeout(() => {
        const newInput = document.querySelector(
          `[data-participant-id="${participantId}"][data-weight-index="${newWeightIndex}"]`
        ) as HTMLInputElement;
        if (newInput) {
          newInput.focus();
        }
      }, 0);
    }
  };

  const updateWeight = (participantId: number, weightIndex: number, value: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      const weights = [...(participant.weights || [])];
      weights[weightIndex] = value === '' ? null : parseInt(value);
      updateParticipant(participantId, { weights });
    }
  };

  const removeWeight = (participantId: number, weightIndex: number) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant && participant.weights) {
      const weights = participant.weights.filter((_, index) => index !== weightIndex);
      updateParticipant(participantId, { weights });
    }
  };

  const calculateTotal = (weights: (number | null)[] = []) => {
    return weights.reduce((sum, weight) => sum + (weight || 0), 0);
  };

  const getSector = (placeNumber: number) => {
    if (!placeNumber) return '';
    let currentPosition = 0;
    for (let i = 0; i < sectorSizes.length; i++) {
      currentPosition += sectorSizes[i];
      if (placeNumber <= currentPosition) {
        return String.fromCharCode(65 + i);
      }
    }
    return '';
  };

  const confirmWeighing = (participantId: number) => {
    updateParticipant(participantId, { weighingConfirmed: true });
    setError(null);
  };

  const unconfirmWeighing = (participantId: number) => {
    updateParticipant(participantId, { weighingConfirmed: false });
  };

  const handleSave = async () => {
    if (!details) {
      setError('Wedstrijd details ontbreken');
      return;
    }

    // Check if any participant has unconfirmed weighings
    const participantsWithWeights = participants.filter(p => p.weights && p.weights.length > 0);
    const unconfirmedParticipants = participantsWithWeights.filter(p => !p.weighingConfirmed);

    if (unconfirmedParticipants.length > 0) {
      setError(`Er zijn nog niet-bevestigde wegingen. Bevestig eerst de weging van ${unconfirmedParticipants[0].name} voordat u verder gaat.`);
      // Scroll to the first unconfirmed participant
      const element = document.querySelector(`[data-participant="${unconfirmedParticipants[0].id}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Calculate total weights and points for each participant
      const participantsWithStats = participants.map(participant => ({
        ...participant,
        totalWeight: calculateTotal(participant.weights),
        points: participant.place ? getSectorRanking(participant, participants) : 0
      }));

      // Save to Supabase if this is an existing competition
      const existingCompetition = findExistingCompetition(details.name, details.date, details.location);
      if (existingCompetition) {
        await addCompetition({
          ...existingCompetition,
          participants: participantsWithStats,
          sectorSizes
        });
      }

      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      setError(null);

      // Navigate to results page after a short delay
      setTimeout(() => {
        navigate('/uitslag');
      }, 1000);
    } catch (err) {
      setError('Er is een fout opgetreden bij het opslaan van de gegevens.');
      console.error('Error saving weighings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeighingAccess = () => {
    if (!competitionId) {
      setError('Sla eerst de wedstrijd op voordat u toegang kunt verlenen voor wegingen.');
      return;
    }
    setShowWeighingAccessDialog(true);
  };

  const getSortedParticipants = () => {
    const participantsWithTotal = participants.map(participant => ({
      ...participant,
      totalWeight: calculateTotal(participant.weights)
    }));

    // Sort by place number
    return participantsWithTotal.sort((a, b) => {
      const aPlace = a.place || Infinity;
      const bPlace = b.place || Infinity;
      return aPlace - bPlace;
    });
  };

  const exportToExcel = () => {
    const sortedParticipants = getSortedParticipants();
    const data = sortedParticipants.map(p => [
      getSector(p.place || 0),
      p.place || '-',
      p.name,
      p.totalWeight,
      getSectorRanking(p, sortedParticipants)
    ]);

    const ws = utils.aoa_to_sheet([
      ['Sector', 'Plaats', 'Naam', 'Gewicht (gram)', 'Punten'],
      ...data
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Wegingen');
    writeFile(wb, 'wegingen.xlsx');
  };

  const getSectorRanking = (participant: Participant & { totalWeight: number }, participants: (Participant & { totalWeight: number })[]) => {
    if (!participant.place) return '-';
    const sector = getSector(participant.place);
    
    // Get all participants in the same sector
    const sectorParticipants = participants.filter(p => p.place && getSector(p.place) === sector);
    
    // Sort sector participants by weight (descending) and place number (ascending)
    const sortedSectorParticipants = sectorParticipants.sort((a, b) => {
      if (b.totalWeight !== a.totalWeight) {
        return b.totalWeight - a.totalWeight;
      }
      return (a.place || 0) - (b.place || 0);
    });

    // Find participant's position in sector
    const position = sortedSectorParticipants.findIndex(p => p.id === participant.id) + 1;
    return position.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => handleNavigation('/plaatsen')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          Vorige
        </button>
        <button
          onClick={handleWeighingAccess}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 border-2 border-blue-600 rounded-md transition-colors"
        >
          <UserPlus size={20} />
          Weging toegang verlenen
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Wegingen</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {sortedParticipants.map((participant) => (
          <div 
            key={participant.id} 
            className="p-4 border rounded-lg bg-gray-50"
            data-participant={participant.id}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-32 flex items-center gap-2">
                <span className="font-semibold">{participant.place || '-'}</span>
                <span className="text-gray-500">
                  ({getSector(participant.place || 0) || '-'})
                </span>
              </div>
              <span className="text-lg">{participant.name}</span>
            </div>

            <div className="ml-32 space-y-3">
              {!participant.weighingConfirmed ? (
                <>
                  {(participant.weights || []).map((weight, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-gray-600 w-24">Weging {index + 1}:</span>
                      <input
                        type="number"
                        value={weight === null ? '' : weight}
                        onChange={(e) => updateWeight(participant.id, index, e.target.value)}
                        className="w-48 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingave in grammen"
                        data-participant-id={participant.id}
                        data-weight-index={index}
                      />
                      <button
                        onClick={() => removeWeight(participant.id, index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Verwijder weging"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => addWeight(participant.id)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Plus size={20} />
                      Voeg weging toe
                    </button>
                  </div>

                  {participant.weights && participant.weights.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-semibold">
                        Totaal: {calculateTotal(participant.weights)} gram
                      </span>
                      <button
                        onClick={() => confirmWeighing(participant.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Save size={20} />
                        Bevestig weging
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">
                    Totaal gewicht: {calculateTotal(participant.weights)} gram
                  </span>
                  <button
                    onClick={() => unconfirmWeighing(participant.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Bewerk
                  </button>
                </div>
              )}
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
            document={<WeighingPDF participants={getSortedParticipants()} getSector={getSector} competition={details || undefined} />}
            fileName="wegingen.pdf"
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
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl text-lg font-semibold disabled:bg-green-400"
          >
            <Save size={24} />
            {isSaving ? 'Opslaan...' : 'Opslaan en verder'}
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

      <WeighingAccessDialog
        isOpen={showWeighingAccessDialog}
        onClose={() => setShowWeighingAccessDialog(false)}
        competitionId={competitionId || ''}
        sectors={sectors}
      />
    </div>
  );
}