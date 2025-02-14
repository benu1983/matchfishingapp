import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { utils, writeFile } from 'xlsx';
import { useSavedResultsStore } from '../store/savedResultsStore';
import type { CriteriumFolder, SavedCompetition, ParticipantWithStats } from '../types';
import { CriteriumStandingsPDF } from '../components/CriteriumStandingsPDF';

interface CompetitionResult {
  points: number;
  weight: number;
  present: boolean;
  excluded?: boolean;
}

interface StandingsParticipant {
  name: string;
  klasse: string;
  competitions: CompetitionResult[];
  totalPoints: number;
  totalWeight: number;
}

interface StandingsData {
  participants: StandingsParticipant[];
  competitions: SavedCompetition[];
}

export function CriteriumStandingsPage() {
  const navigate = useNavigate();
  const { criteriumFolders, getCompetitionsByFolder } = useSavedResultsStore();
  const [selectedFolder, setSelectedFolder] = useState<CriteriumFolder | null>(null);
  const [penaltyPoints, setPenaltyPoints] = useState<number>(20);
  const [excludeCount, setExcludeCount] = useState<number>(0);
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null);

  const calculateStandings = () => {
    if (!selectedFolder) return;

    const competitions = getCompetitionsByFolder(selectedFolder.id);
    const participantMap = new Map<string, StandingsParticipant>();

    // First pass: collect all unique participants
    competitions.forEach(competition => {
      competition.participants.forEach(participant => {
        if (!participant.name) return;

        if (!participantMap.has(participant.name)) {
          participantMap.set(participant.name, {
            name: participant.name,
            klasse: participant.klasse || '-',
            competitions: Array(competitions.length).fill({
              points: penaltyPoints,
              weight: 0,
              present: false
            }),
            totalPoints: 0,
            totalWeight: 0
          });
        }
      });
    });

    // Second pass: fill in competition results
    competitions.forEach((competition, competitionIndex) => {
      competition.participants.forEach(participant => {
        if (!participant.name) return;

        const standingsParticipant = participantMap.get(participant.name);
        if (standingsParticipant) {
          standingsParticipant.competitions[competitionIndex] = {
            points: participant.points,
            weight: participant.totalWeight,
            present: true
          };
        }
      });
    });

    // Calculate totals with exclusions
    const participants = Array.from(participantMap.values()).map(participant => {
      // First, handle absent competitions
      const absentResults = participant.competitions
        .map((comp, index) => ({ ...comp, index }))
        .filter(comp => !comp.present);

      // Then, handle present competitions
      const presentResults = participant.competitions
        .map((comp, index) => ({ ...comp, index }))
        .filter(comp => comp.present)
        .sort((a, b) => {
          if (a.points === b.points) {
            return a.weight - b.weight; // Lower weight gets excluded first
          }
          return b.points - a.points; // Higher points get excluded
        });

      // Determine how many results to exclude
      const remainingExclusions = Math.max(0, excludeCount - absentResults.length);
      
      // Mark competitions as excluded
      const excludedIndices = new Set([
        ...absentResults.slice(0, excludeCount).map(r => r.index),
        ...presentResults.slice(0, remainingExclusions).map(r => r.index)
      ]);

      // Mark excluded competitions in the participant's data
      participant.competitions = participant.competitions.map((comp, index) => ({
        ...comp,
        excluded: excludedIndices.has(index)
      }));

      // Calculate totals excluding marked competitions
      participant.totalPoints = participant.competitions.reduce(
        (sum, comp) => sum + (comp.excluded ? 0 : (comp.present ? comp.points : penaltyPoints)),
        0
      );
      participant.totalWeight = participant.competitions.reduce(
        (sum, comp) => sum + (comp.excluded ? 0 : comp.weight),
        0
      );

      return participant;
    });

    // Sort by total points (ascending) and total weight (descending)
    participants.sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) {
        return a.totalPoints - b.totalPoints;
      }
      return b.totalWeight - a.totalWeight;
    });

    setStandingsData({
      participants,
      competitions
    });
  };

  const exportToExcel = () => {
    if (!standingsData) return;

    const headers = ['Ranking', 'Klasse', 'Naam'];
    standingsData.competitions.forEach((_, index) => {
      headers.push(`W${index + 1} Ptn`);
      headers.push(`W${index + 1} Gewicht`);
    });
    headers.push('Totaal Ptn', 'Totaal Gewicht');

    const data = standingsData.participants.map((participant, index) => {
      const row = [
        index + 1,
        participant.klasse,
        participant.name
      ];

      participant.competitions.forEach(comp => {
        row.push(comp.excluded ? `(${comp.present ? comp.points : penaltyPoints})` : (comp.present ? comp.points : penaltyPoints));
        row.push(comp.excluded ? `(${comp.weight})` : comp.weight);
      });

      row.push(participant.totalPoints);
      row.push(participant.totalWeight);

      return row;
    });

    const ws = utils.aoa_to_sheet([headers, ...data]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Tussenstand');
    writeFile(wb, 'tussenstand.xlsx');
  };

  const handlePenaltyPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPenaltyPoints(0);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setPenaltyPoints(num);
    }
  };

  const handleExcludeCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setExcludeCount(0);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setExcludeCount(num);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/uitslagen')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Home size={20} />
          Terug naar uitslagen
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tussenstand Criterium</h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">1. Selecteer criterium map</h3>
          <div className="grid grid-cols-2 gap-3">
            {criteriumFolders.map((folder) => (
              <label
                key={folder.id}
                className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedFolder?.id === folder.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="folder"
                  checked={selectedFolder?.id === folder.id}
                  onChange={() => setSelectedFolder(folder)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>{folder.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">2. Strafpunten voor afwezigheid</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={penaltyPoints}
              onChange={handlePenaltyPointsChange}
              onFocus={handleFocus}
              className="w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600">punten</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">3. Aantal wedstrijden laten vallen</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={excludeCount}
              onChange={handleExcludeCountChange}
              onFocus={handleFocus}
              className="w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600">wedstrijden</span>
          </div>
        </div>

        <button
          onClick={calculateStandings}
          disabled={!selectedFolder}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          Bereken tussenstand
        </button>

        {standingsData && (
          <div className="space-y-4">
            <div className="flex justify-end gap-4 mb-4">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 border-2 border-green-600 rounded-md transition-colors"
              >
                <FileSpreadsheet size={20} />
                Excel
              </button>
              <PDFDownloadLink
                document={
                  <CriteriumStandingsPDF
                    folderName={selectedFolder?.name || ''}
                    penaltyPoints={penaltyPoints}
                    excludeCount={excludeCount}
                    participants={standingsData.participants}
                  />
                }
                fileName="tussenstand.pdf"
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 border-2 border-red-600 rounded-md transition-colors"
              >
                {({ loading }) => (
                  <>
                    <FileText size={20} />
                    {loading ? 'Laden...' : 'PDF'}
                  </>
                )}
              </PDFDownloadLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-gray-50">
                    <th rowSpan={2} className="py-2 px-4 text-left border-b">Ranking</th>
                    <th rowSpan={2} className="py-2 px-4 text-left border-b">Klasse</th>
                    <th rowSpan={2} className="py-2 px-4 text-left border-b">Naam</th>
                    {standingsData.competitions.map((_, index) => (
                      <th key={index} colSpan={1} className="py-2 px-4 text-center border-b">
                        W{index + 1}
                      </th>
                    ))}
                    <th rowSpan={2} className="py-2 px-4 text-center border-b">
                      Totaal<br/>Ptn
                    </th>
                    <th rowSpan={2} className="py-2 px-4 text-center border-b">
                      Totaal<br/>Gewicht
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standingsData.participants.map((participant, index) => (
                    <React.Fragment key={participant.name}>
                      {/* Points row */}
                      <tr className="border-t">
                        <td rowSpan={2} className="py-2 px-4 font-semibold">{index + 1}</td>
                        <td rowSpan={2} className="py-2 px-4">{participant.klasse}</td>
                        <td rowSpan={2} className="py-2 px-4">{participant.name}</td>
                        {participant.competitions.map((comp, compIndex) => (
                          <td 
                            key={`points-${compIndex}`} 
                            className={`py-2 px-4 text-center ${
                              comp.excluded ? 'text-gray-400 line-through' :
                              !comp.present ? 'text-red-600 font-semibold' : ''
                            }`}
                          >
                            {comp.present ? comp.points : penaltyPoints}
                          </td>
                        ))}
                        <td rowSpan={2} className="py-2 px-4 text-center font-semibold">
                          {participant.totalPoints}
                        </td>
                        <td rowSpan={2} className="py-2 px-4 text-center font-semibold">
                          {participant.totalWeight}
                        </td>
                      </tr>
                      {/* Weight row */}
                      <tr className="border-t bg-gray-50">
                        {participant.competitions.map((comp, compIndex) => (
                          <td 
                            key={`weight-${compIndex}`} 
                            className={`py-2 px-4 text-center ${
                              comp.excluded ? 'text-gray-400 line-through' : 'text-gray-600'
                            }`}
                          >
                            {comp.weight}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}