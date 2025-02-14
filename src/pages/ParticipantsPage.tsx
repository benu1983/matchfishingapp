import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPlus, Save, Trash2, FileSpreadsheet, FileText, ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useParticipantsStore } from '../store/participantsStore';
import { useCompetitionStore } from '../store/competitionStore';
import { useSavedResultsStore } from '../store/savedResultsStore';
import { ParticipantsPDF } from '../components/ParticipantsPDF';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { SaveSuccessMessage } from '../components/SaveSuccessMessage';
import type { Participant, ColumnToggles } from '../types';

interface DuplicateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  competitionName: string;
}

function DuplicateDialog({ isOpen, onClose, onConfirm, competitionName }: DuplicateDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-yellow-500" size={24} />
          <h2 className="text-xl font-semibold">Wedstrijd bestaat al</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Er bestaat al een wedstrijd met dezelfde naam, datum en locatie. 
          Wilt u de bestaande wedstrijd overschrijven?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Overschrijven
          </button>
        </div>
      </div>
    </div>
  );
}

export function ParticipantsPage() {
  const navigate = useNavigate();
  const { participants, addParticipant, removeParticipant, updateParticipant, hasUnsavedChanges, setHasUnsavedChanges, setParticipants } = useParticipantsStore();
  const { details } = useCompetitionStore();
  const { addCompetition, getCompetitionsByType } = useSavedResultsStore();
  const [columns, setColumns] = useState<ColumnToggles & { payment: boolean }>({
    club: false,
    klasse: false,
    payment: false
  });
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const klasseOptions = ['U15', 'U20', 'U25', 'S', 'M', 'V', 'D'];

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

  const checkDuplicateName = (name: string, currentId: number): string | null => {
    const duplicate = participants.find(p => 
      p.id !== currentId && 
      p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return duplicate ? duplicate.name : null;
  };

  const handleNameChange = (id: number, name: string) => {
    updateParticipant(id, { name });
  };

  const validateName = (id: number, name: string) => {
    const duplicateName = checkDuplicateName(name, id);
    if (duplicateName) {
      setError(`De naam "${name}" is al toegewezen aan een andere deelnemer.`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleKeyPress = (
    event: React.KeyboardEvent,
    participantId: number,
    field: keyof Participant,
    participantIndex: number
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const participant = participants.find(p => p.id === participantId);
      if (!participant) return;

      if (!validateName(participantId, participant.name)) {
        return;
      }

      const nextField = getNextField(field);
      if (nextField) {
        // Move to next field in same row
        const nextElement = document.querySelector(`[data-participant="${participantId}"][data-field="${nextField}"]`) as HTMLElement;
        nextElement?.focus();
      } else if (participantIndex < participants.length - 1) {
        // Move to first field of next row
        const nextElement = document.querySelector(`[data-participant="${participantId + 1}"][data-field="name"]`) as HTMLElement;
        nextElement?.focus();
      } else {
        // Add new participant and focus its name field
        addParticipant();
        setTimeout(() => {
          const nextElement = document.querySelector(`[data-participant="${participantId + 1}"][data-field="name"]`) as HTMLElement;
          nextElement?.focus();
        }, 0);
      }
    }
  };

  const handleBlur = (id: number, name: string) => {
    validateName(id, name);
  };

  const getNextField = (currentField: keyof Participant): keyof Participant | null => {
    const fields: (keyof Participant)[] = ['name'];
    if (columns.club) fields.push('club');
    if (columns.klasse) fields.push('klasse');
    
    const currentIndex = fields.indexOf(currentField);
    return fields[currentIndex + 1] || null;
  };

  const toggleColumn = (column: keyof ColumnToggles | 'payment') => {
    setColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const checkForDuplicate = () => {
    if (!details) return false;

    const existingCompetitions = getCompetitionsByType(details.type);
    return existingCompetitions.some(c => 
      c.name === details.name && 
      c.date === details.date && 
      c.location === details.location
    );
  };

  const handleSave = async () => {
    // Filter out participants without a name
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    if (validParticipants.length === 0) {
      setError('Voeg ten minste één deelnemer toe met een naam.');
      return;
    }

    if (!details) {
      setError('Wedstrijd details ontbreken.');
      return;
    }

    // Check for duplicate competition
    if (checkForDuplicate()) {
      setShowDuplicateDialog(true);
      return;
    }

    await saveCompetition();
  };

  const saveCompetition = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const validParticipants = participants.filter(p => p.name.trim() !== '');
      
      // Renumber the participants
      const renumberedParticipants = validParticipants.map((p, index) => ({
        ...p,
        id: index + 1,
        totalWeight: 0,
        points: 0
      }));

      if (!details) throw new Error('Competition details missing');

      // Save to Supabase
      const success = await addCompetition({
        id: `${Date.now()}`,
        ...details,
        participants: renumberedParticipants,
        sectorSizes: [10]
      });

      if (!success) {
        throw new Error('Failed to save competition');
      }

      setParticipants(renumberedParticipants);
      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      setShowDuplicateDialog(false);

      // Navigate to the next page after a short delay
      setTimeout(() => {
        navigate('/plaatsen');
      }, 1000);
    } catch (err) {
      setError('Er is een fout opgetreden bij het opslaan van de gegevens.');
      console.error('Error saving competition:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToExcel = () => {
    const headers = ['Nr.', 'Naam'];
    if (columns.club) headers.push('Club');
    if (columns.klasse) headers.push('Klasse');

    const validParticipants = participants.filter(p => p.name.trim() !== '');

    const data = validParticipants.map(p => {
      const row: (string | number)[] = [p.id, p.name];
      if (columns.club) row.push(p.club || '');
      if (columns.klasse) row.push(p.klasse || '');
      return row;
    });

    const ws = utils.aoa_to_sheet([headers, ...data]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Deelnemers');
    writeFile(wb, 'deelnemers.xlsx');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => handleNavigation('/wedstrijd')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          Vorige
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Deelnemers</h2>

      <div className="mb-6 flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
        <span className="font-semibold text-gray-700">Kolommen:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={columns.club}
            onChange={() => toggleColumn('club')}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-600">Club</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={columns.klasse}
            onChange={() => toggleColumn('klasse')}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-600">Klasse</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={columns.payment}
            onChange={() => toggleColumn('payment')}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-600">Betaald</span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {participants.map((participant, index) => (
          <div key={participant.id} className="flex gap-4 p-4 border rounded-lg bg-gray-50 items-center">
            <span className="font-bold text-lg w-12">{participant.id}.</span>
            <div className="flex-grow flex gap-4">
              <input
                type="text"
                value={participant.name}
                onChange={(e) => handleNameChange(participant.id, e.target.value)}
                onBlur={(e) => handleBlur(participant.id, e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, participant.id, 'name', index)}
                placeholder="Naam deelnemer"
                className="w-80 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-participant={participant.id}
                data-field="name"
              />
              {columns.club && (
                <input
                  type="text"
                  value={participant.club || ''}
                  onChange={(e) => updateParticipant(participant.id, { club: e.target.value })}
                  onKeyDown={(e) => handleKeyPress(e, participant.id, 'club', index)}
                  placeholder="Club"
                  className="w-52 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-participant={participant.id}
                  data-field="club"
                />
              )}
              {columns.klasse && (
                <select
                  value={participant.klasse || ''}
                  onChange={(e) => updateParticipant(participant.id, { klasse: e.target.value })}
                  onKeyDown={(e) => handleKeyPress(e, participant.id, 'klasse', index)}
                  className="w-28 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-participant={participant.id}
                  data-field="klasse"
                >
                  <option value="">Selecteer</option>
                  {klasseOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {columns.payment && (
                <button
                  onClick={() => updateParticipant(participant.id, { hasPaid: !participant.hasPaid })}
                  className={`w-28 px-3 py-2 rounded-md border transition-colors flex items-center justify-center gap-2 ${
                    participant.hasPaid
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {participant.hasPaid && <Check size={16} />}
                  {participant.hasPaid ? 'Betaald' : 'Niet betaald'}
                </button>
              )}
            </div>
            <button
              onClick={() => removeParticipant(participant.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
              title="Verwijder deelnemer"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={addParticipant}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <ListPlus size={20} />
          Voeg deelnemer toe
        </button>
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
            document={<ParticipantsPDF participants={participants.filter(p => p.name.trim() !== '')} columns={columns} competition={details || undefined} />}
            fileName="deelnemers.pdf"
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

      <DuplicateDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        onConfirm={saveCompetition}
        competitionName={details?.name || ''}
      />
    </div>
  );
}