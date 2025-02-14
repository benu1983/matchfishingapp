import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, Folder, ArrowLeft } from 'lucide-react';
import { useCompetitionStore } from '../store/competitionStore';
import { useParticipantsStore } from '../store/participantsStore';
import { useSavedResultsStore } from '../store/savedResultsStore';
import { SaveSuccessMessage } from '../components/SaveSuccessMessage';
import type { CompetitionType } from '../types';

const competitionTypes: { id: CompetitionType; label: string }[] = [
  { id: 'individual-free', label: 'Vrije wedstrijd individueel' },
  { id: 'pair-free', label: 'Vrije wedstrijd koppel' },
  { id: 'individual-criterium', label: 'Criterium wedstrijd' },
  { id: 'pair-criterium', label: 'Criterium koppel wedstrijd' }
];

export function CompetitionDetailsPage() {
  const navigate = useNavigate();
  const { details, setDetails, clearDetails } = useCompetitionStore();
  const { clearParticipants } = useParticipantsStore();
  const { getCriteriumFoldersByType, getNextCompetitionNumber } = useSavedResultsStore();
  const [name, setName] = useState(details?.name || '');
  const [date, setDate] = useState(details?.date || new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(details?.location || '');
  const [type, setType] = useState<CompetitionType>(details?.type || 'individual-free');
  const [criteriumFolderId, setCriteriumFolderId] = useState(details?.criteriumFolderId || '');
  const [error, setError] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const isCriterium = type === 'individual-criterium' || type === 'pair-criterium';
  const criteriumFolders = isCriterium 
    ? getCriteriumFoldersByType(type as 'individual-criterium' | 'pair-criterium')
    : [];

  useEffect(() => {
    if (isCriterium && criteriumFolderId) {
      const nextNumber = getNextCompetitionNumber(criteriumFolderId);
      setName(`W${nextNumber}`);
    }
  }, [criteriumFolderId, isCriterium, getNextCompetitionNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCriterium && !name.trim()) {
      setError('Vul een naam in voor de wedstrijd');
      return;
    }

    if (!location.trim()) {
      setError('Vul een locatie in');
      return;
    }

    if (isCriterium && !criteriumFolderId) {
      setError('Selecteer een map voor het criterium');
      return;
    }

    setDetails({
      name: isCriterium ? name : name.trim(),
      date,
      location: location.trim(),
      type,
      criteriumFolderId: isCriterium ? criteriumFolderId : undefined
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      navigate('/deelnemers');
    }, 1000);
  };

  const handleClear = () => {
    clearDetails();
    clearParticipants();
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setType('individual-free');
    setCriteriumFolderId('');
    setShowClearDialog(false);
  };

  const handleTypeChange = (newType: CompetitionType) => {
    setType(newType);
    if (newType !== 'individual-criterium' && newType !== 'pair-criterium') {
      setCriteriumFolderId('');
      setName('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          Vorige
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Wedstrijd details</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {!isCriterium && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naam wedstrijd
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Voer de naam van de wedstrijd in"
                />
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locatie
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Voer de locatie in"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type wedstrijd
              </label>
              <div className="grid grid-cols-1 gap-3">
                {competitionTypes.map((competitionType) => (
                  <label
                    key={competitionType.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      type === competitionType.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={competitionType.id}
                      checked={type === competitionType.id}
                      onChange={(e) => handleTypeChange(e.target.value as CompetitionType)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3">{competitionType.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {isCriterium && criteriumFolders.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecteer criterium map
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {criteriumFolders.map((folder) => (
                    <label
                      key={folder.id}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        criteriumFolderId === folder.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="criteriumFolder"
                        value={folder.id}
                        checked={criteriumFolderId === folder.id}
                        onChange={(e) => setCriteriumFolderId(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Folder size={18} className="text-gray-500" />
                      <span>{folder.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isCriterium && criteriumFolders.length === 0 && (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                Er zijn nog geen mappen aangemaakt voor dit type criterium.
                Ga naar "Opgeslagen uitslagen" om eerst een map aan te maken.
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            <Save size={24} />
            Opslaan en verder
          </button>
          <button
            type="button"
            onClick={() => setShowClearDialog(true)}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Wis alle gegevens
          </button>
          {showSaveSuccess && (
            <SaveSuccessMessage 
              show={showSaveSuccess} 
              onHide={() => setShowSaveSuccess(false)} 
            />
          )}
        </div>
      </form>

      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold">Wis alle gegevens</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Weet u zeker dat u alle gegevens wilt wissen? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Wis gegevens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}