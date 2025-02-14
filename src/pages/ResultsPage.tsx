import React, { useState, useRef } from 'react';
import { ArrowLeft, FileSpreadsheet, FileText, Save, AlertTriangle, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { utils, writeFile } from 'xlsx';
import { useParticipantsStore } from '../store/participantsStore';
import { useCompetitionStore } from '../store/competitionStore';
import { useSavedResultsStore } from '../store/savedResultsStore';
import { ResultsPDF } from '../components/ResultsPDF';
import { SaveSuccessMessage } from '../components/SaveSuccessMessage';
import type { ParticipantWithStats, SavedCompetition, Participant } from '../types';

interface OverwriteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  competitionName: string;
}

function OverwriteDialog({ isOpen, onClose, onConfirm, competitionName }: OverwriteDialogProps) {
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

export function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participants, sectorSizes } = useParticipantsStore();
  const { details } = useCompetitionStore();
  const { addCompetition, removeCompetition, getCompetitionsByType } = useSavedResultsStore();
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState<SavedCompetition | null>(null);

  const savedCompetition = location.state?.competition as SavedCompetition | undefined;
  const fromSavedResult = location.state?.fromSavedResult;

  const activeParticipants = savedCompetition?.participants || participants;
  const activeSectorSizes = savedCompetition?.sectorSizes || sectorSizes;
  const activeDetails = savedCompetition || details;

  const hasKlasse = activeParticipants.some(p => p.klasse);
  const hasClub = activeParticipants.some(p => p.club);

  const handleBackClick = () => {
    if (activeDetails?.criteriumFolderId) {
      navigate('/uitslagen');
    } else {
      navigate('/');
    }
  };

  const getSector = (placeNumber: number): string => {
    if (!placeNumber) return '';
    let currentPosition = 0;
    for (let i = 0; i < activeSectorSizes.length; i++) {
      currentPosition += activeSectorSizes[i];
      if (placeNumber <= currentPosition) {
        return String.fromCharCode(65 + i);
      }
    }
    return '';
  };

  const calculateTotalWeight = (participant: ParticipantWithStats): number => {
    return (participant.weights || []).reduce((sum, weight) => sum + (weight || 0), 0);
  };

  const getSectorRanking = (participant: ParticipantWithStats, allParticipants: ParticipantWithStats[]): number => {
    if (!participant.place) return 0;
    const sector = getSector(participant.place);
    
    const sectorParticipants = allParticipants.filter(p => p.place && getSector(p.place) === sector);
    
    const sortedSectorParticipants = sectorParticipants.sort((a, b) => {
      if (b.totalWeight !== a.totalWeight) {
        return b.totalWeight - a.totalWeight;
      }
      return (a.place || 0) - (b.place || 0);
    });

    return sortedSectorParticipants.findIndex(p => p.id === participant.id) + 1;
  };

  const getResults = (): ParticipantWithStats[] => {
    if (savedCompetition) {
      return savedCompetition.participants;
    }

    const participantsWithWeights = activeParticipants.map(participant => ({
      ...participant,
      totalWeight: calculateTotalWeight(participant),
      points: 0
    }));

    const participantsWithPoints = participantsWithWeights.map(participant => ({
      ...participant,
      points: participant.place ? getSectorRanking(participant, participantsWithWeights) : 0
    }));

    return participantsWithPoints.sort((a, b) => {
      if (a.points !== b.points) {
        return a.points - b.points;
      }
      if (b.totalWeight !== a.totalWeight) {
        return b.totalWeight - a.totalWeight;
      }
      return (a.place || 0) - (b.place || 0);
    });
  };

  const handleSave = () => {
    if (!details) return;

    const results = getResults();
    const id = savedCompetition?.id || `${Date.now()}`;

    const competition = {
      id,
      ...details,
      participants: results,
      sectorSizes: activeSectorSizes
    };

    const success = addCompetition(competition);

    if (success) {
      setShowSaveSuccess(true);
      setError(null);
      setPendingSave(null);
    } else {
      setPendingSave(competition);
      setShowOverwriteDialog(true);
    }
  };

  const handleOverwrite = () => {
    if (!pendingSave) return;

    const existingCompetitions = getCompetitionsByType(pendingSave.type);
    const existing = existingCompetitions.find(c => 
      c.name === pendingSave.name && 
      c.date === pendingSave.date && 
      c.location === pendingSave.location
    );

    if (existing) {
      removeCompetition(existing.id);
    }

    addCompetition(pendingSave);
    setShowSaveSuccess(true);
    setError(null);
    setShowOverwriteDialog(false);
    setPendingSave(null);
  };

  const getFileName = () => {
    if (!activeDetails) return 'uitslag';
    const date = new Date(activeDetails.date).toISOString().split('T')[0];
    return `${activeDetails.name}-${date}`.toLowerCase().replace(/\s+/g, '-');
  };

  const exportToExcel = () => {
    const results = getResults();
    const headers = ['Ranking', 'Sector', 'Plaats'];
    if (hasKlasse) headers.push('Klasse');
    headers.push('Naam');
    if (hasClub) headers.push('Club');
    headers.push('Gewicht (gram)', 'Punten');

    const data = results.map((p, index) => {
      const row = [
        index + 1,
        getSector(p.place || 0),
        p.place || '-'
      ];
      if (hasKlasse) row.push(p.klasse || '-');
      row.push(p.name);
      if (hasClub) row.push(p.club || '-');
      row.push(p.totalWeight, p.points);
      return row;
    });

    const ws = utils.aoa_to_sheet([headers, ...data]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Uitslag');
    writeFile(wb, `${getFileName()}.xlsx`);
  };

  const results = getResults();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/weging')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          Vorige
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Uitslag</h2>

      {activeDetails && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{activeDetails.name}</h3>
          <div className="text-gray-600">
            <p>Datum: {new Date(activeDetails.date).toLocaleDateString('nl-NL')}</p>
            <p>Locatie: {activeDetails.location}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 w-20">Ranking</th>
              <th className="py-2 w-20">Sector</th>
              <th className="py-2 w-20">Plaats</th>
              {hasKlasse && <th className="py-2 w-24">Klasse</th>}
              <th className="py-2">Naam</th>
              {hasClub && <th className="py-2 w-32">Club</th>}
              <th className="py-2 text-right w-32">Gewicht</th>
              <th className="py-2 text-right w-24">Punten</th>
            </tr>
          </thead>
          <tbody>
            {results.map((participant, index) => (
              <tr key={participant.id} className="border-b last:border-b-0">
                <td className="py-2 font-semibold">{index + 1}</td>
                <td className="py-2">{participant.place ? getSector(participant.place) : '-'}</td>
                <td className="py-2">{participant.place || '-'}</td>
                {hasKlasse && <td className="py-2">{participant.klasse || '-'}</td>}
                <td className="py-2">{participant.name}</td>
                {hasClub && <td className="py-2">{participant.club || '-'}</td>}
                <td className="py-2 text-right font-semibold">
                  {participant.totalWeight} gram
                </td>
                <td className="py-2 text-right font-semibold">
                  {participant.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 flex items-center gap-4">
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
              document={
                <ResultsPDF 
                  results={results}
                  getSector={getSector}
                  hasKlasse={hasKlasse}
                  hasClub={hasClub}
                  competitionName={activeDetails?.name}
                  competitionDate={activeDetails?.date}
                  competitionLocation={activeDetails?.location}
                />
              }
              fileName={`${getFileName()}.pdf`}
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
              Opslaan
            </button>
          </div>
          {showSaveSuccess && (
            <SaveSuccessMessage 
              show={showSaveSuccess} 
              onHide={() => setShowSaveSuccess(false)} 
            />
          )}
        </div>
      </div>

      <OverwriteDialog
        isOpen={showOverwriteDialog}
        onClose={() => {
          setShowOverwriteDialog(false);
          setPendingSave(null);
        }}
        onConfirm={handleOverwrite}
        competitionName={pendingSave?.name || ''}
      />
    </div>
  );
}