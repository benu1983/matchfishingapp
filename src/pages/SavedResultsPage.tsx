import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Trash2, FolderOpen, Calendar, MapPin, FolderPlus, Folder, Download, Upload, Save, X, Eye, Edit, AlertTriangle, Pencil, Trophy } from 'lucide-react';
import { useSavedResultsStore } from '../store/savedResultsStore';
import { useCompetitionStore } from '../store/competitionStore';
import { useParticipantsStore } from '../store/participantsStore';
import type { CompetitionType, SavedCompetition, CriteriumFolder } from '../types';

const competitionTypes: { id: CompetitionType; label: string }[] = [
  { id: 'individual-free', label: 'Vrije wedstrijd individueel' },
  { id: 'pair-free', label: 'Vrije wedstrijd koppel' },
  { id: 'individual-criterium', label: 'Criterium wedstrijd' },
  { id: 'pair-criterium', label: 'Criterium koppel wedstrijd' }
];

interface OpenModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: 'view' | 'edit') => void;
}

function OpenModeDialog({ isOpen, onClose, onSelect }: OpenModeDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Open uitslag</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Hoe wilt u deze uitslag openen?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect('view')}
            className="flex flex-col items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye size={24} className="text-blue-600" />
            <div className="text-center">
              <div className="font-semibold">Bekijken</div>
              <div className="text-sm text-gray-500">Alleen de uitslag bekijken</div>
            </div>
          </button>
          <button
            onClick={() => onSelect('edit')}
            className="flex flex-col items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit size={24} className="text-green-600" />
            <div className="text-center">
              <div className="font-semibold">Bewerken</div>
              <div className="text-sm text-gray-500">Gegevens aanpassen</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  competitionName: string;
}

function DeleteConfirmDialog({ isOpen, onClose, onConfirm, competitionName }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold">Verwijder uitslag</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Weet u zeker dat u de uitslag van {competitionName} wilt verwijderen? 
          Dit kan niet ongedaan worden gemaakt.
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
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
}

function DeleteFolderDialog({ isOpen, onClose, onConfirm, folderName }: DeleteFolderDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold">Verwijder map</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Weet u zeker dat u de map "{folderName}" wilt verwijderen? 
          Alle uitslagen in deze map worden losgekoppeld van de map.
          Dit kan niet ongedaan worden gemaakt.
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
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditFolderNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  currentName: string;
}

function EditFolderNameDialog({ isOpen, onClose, onConfirm, currentName }: EditFolderNameDialogProps) {
  const [name, setName] = useState(currentName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Wijzig mapnaam</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam van de map"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={() => onConfirm(name)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={!name.trim() || name === currentName}
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditCompetitionNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  currentName: string;
}

function EditCompetitionNameDialog({ isOpen, onClose, onConfirm, currentName }: EditCompetitionNameDialogProps) {
  const [name, setName] = useState(currentName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Wijzig naam</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam van de wedstrijd"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={() => onConfirm(name)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={!name.trim() || name === currentName}
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

export function SavedResultsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    competitions, 
    removeCompetition, 
    getCompetitionsByType,
    getCompetitionsByFolder,
    criteriumFolders,
    addCriteriumFolder,
    removeCriteriumFolder,
    getCriteriumFoldersByType,
    importData,
    exportData,
    updateCriteriumFolder,
    updateCompetition
  } = useSavedResultsStore();
  const { setDetails } = useCompetitionStore();
  const { setParticipants, setSectorSizes } = useParticipantsStore();
  const [selectedType, setSelectedType] = useState<CompetitionType>('individual-free');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showOpenModeDialog, setShowOpenModeDialog] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<SavedCompetition | null>(null);
  const [competitionToDelete, setCompetitionToDelete] = useState<SavedCompetition | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<CriteriumFolder | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<CriteriumFolder | null>(null);
  const [competitionToEdit, setCompetitionToEdit] = useState<SavedCompetition | null>(null);
  const [exportFilename, setExportFilename] = useState('hengelsport-uitslagen');
  const [newFolderName, setNewFolderName] = useState('');

  const handleOpenCompetition = (competition: SavedCompetition) => {
    setSelectedCompetition(competition);
    setShowOpenModeDialog(true);
  };

  const handleSelectOpenMode = (mode: 'view' | 'edit') => {
    if (!selectedCompetition) return;

    if (mode === 'edit') {
      setDetails({
        name: selectedCompetition.name,
        date: selectedCompetition.date,
        location: selectedCompetition.location,
        type: selectedCompetition.type,
        criteriumFolderId: selectedCompetition.criteriumFolderId
      });
      setParticipants(selectedCompetition.participants);
      setSectorSizes(selectedCompetition.sectorSizes);
      navigate('/deelnemers');
    } else {
      navigate('/uitslag', { 
        state: { 
          fromSavedResult: true,
          competition: selectedCompetition
        }
      });
    }

    setShowOpenModeDialog(false);
    setSelectedCompetition(null);
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    addCriteriumFolder(
      newFolderName.trim(), 
      selectedType as 'individual-criterium' | 'pair-criterium'
    );
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleFolderClick = (folderId: string) => {
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    } else {
      setSelectedFolderId(folderId);
    }
  };

  const handleDeleteFolderClick = (folder: CriteriumFolder, event: React.MouseEvent) => {
    event.stopPropagation();
    setFolderToDelete(folder);
  };

  const handleEditFolderClick = (folder: CriteriumFolder, event: React.MouseEvent) => {
    event.stopPropagation();
    setFolderToEdit(folder);
  };

  const handleEditFolderConfirm = (newName: string) => {
    if (folderToEdit && newName.trim() !== folderToEdit.name) {
      updateCriteriumFolder(folderToEdit.id, newName.trim());
    }
    setFolderToEdit(null);
  };

  const handleDeleteFolderConfirm = () => {
    if (folderToDelete) {
      removeCriteriumFolder(folderToDelete.id);
      setSelectedFolderId(null);
      setFolderToDelete(null);
    }
  };

  const handleExport = () => {
    if (!exportFilename.trim()) {
      alert('Geef een bestandsnaam op');
      return;
    }

    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename.trim()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        importData(data);
      } catch (error) {
        alert('Er is een fout opgetreden bij het importeren van het bestand.');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (competition: SavedCompetition) => {
    setCompetitionToDelete(competition);
  };

  const handleDeleteConfirm = () => {
    if (competitionToDelete) {
      removeCompetition(competitionToDelete.id);
      setCompetitionToDelete(null);
    }
  };

  const handleEditCompetitionName = (competition: SavedCompetition) => {
    setCompetitionToEdit(competition);
  };

  const handleEditCompetitionNameConfirm = (newName: string) => {
    if (competitionToEdit && newName.trim() !== competitionToEdit.name) {
      updateCompetition(competitionToEdit.id, { name: newName.trim() });
    }
    setCompetitionToEdit(null);
  };

  const isCriteriumType = selectedType === 'individual-criterium' || selectedType === 'pair-criterium';
  const folders = isCriteriumType ? getCriteriumFoldersByType(selectedType as 'individual-criterium' | 'pair-criterium') : [];
  const currentCompetitions = selectedFolderId 
    ? getCompetitionsByFolder(selectedFolderId)
    : getCompetitionsByType(selectedType);

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
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Exporteer uitslagen
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer">
            <Upload size={20} />
            Importeer uitslagen
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Opgeslagen uitslagen</h2>

      <div className="flex flex-col gap-4 mb-6">
        {competitionTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setSelectedType(type.id);
              setSelectedFolderId(null);
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-md whitespace-nowrap transition-colors ${
              selectedType === type.id && !selectedFolderId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FolderOpen size={20} />
            {type.label}
          </button>
        ))}
      </div>

      {isCriteriumType && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Mappen</h3>
            <button
              onClick={() => setShowNewFolderDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <FolderPlus size={18} />
              Nieuwe map
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            {folders.map((folder) => (
              <div key={folder.id} className="flex flex-col gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    selectedFolderId === folder.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <Folder size={18} />
                  <span>{folder.name}</span>
                  {selectedFolderId === folder.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditFolderClick(folder, e)}
                        className="ml-2 p-1 hover:bg-blue-500 rounded"
                        title="Wijzig mapnaam"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolderClick(folder, e)}
                        className="p-1 hover:bg-red-500 rounded"
                        title="Verwijder map"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {selectedFolderId === folder.id && (
                  <button
                    onClick={() => navigate('/tussenstand')}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors ml-6"
                  >
                    <Trophy size={18} />
                    Stand Criterium Berekenen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {currentCompetitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen opgeslagen uitslagen gevonden
          </div>
        ) : (
          currentCompetitions.map((competition) => (
            <div
              key={competition.id}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{competition.name}</h3>
                  <div className="flex gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(competition.date).toLocaleDateString('nl-NL')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {competition.location}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenCompetition(competition)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FolderOpen size={16} />
                    Open
                  </button>
                  <button
                    onClick={() => handleEditCompetitionName(competition)}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Wijzig naam"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(competition)}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Verwijder uitslag"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nieuwe map</h2>
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Naam van de map"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!newFolderName.trim()}
              >
                Map aanmaken
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Exporteer uitslagen</h2>
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  setExportFilename('hengelsport-uitslagen');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-1">
                Bestandsnaam
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="filename"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder="Voer een bestandsnaam in"
                  className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <span className="text-gray-500">.json</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  setExportFilename('hengelsport-uitslagen');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!exportFilename.trim()}
              >
                Exporteren
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteFolderDialog
        isOpen={folderToDelete !== null}
        onClose={() => setFolderToDelete(null)}
        onConfirm={handleDeleteFolderConfirm}
        folderName={folderToDelete?.name || ''}
      />

      <DeleteConfirmDialog
        isOpen={competitionToDelete !== null}
        onClose={() => setCompetitionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        competitionName={competitionToDelete?.name || ''}
      />

      <OpenModeDialog
        isOpen={showOpenModeDialog}
        onClose={() => {
          setShowOpenModeDialog(false);
          setSelectedCompetition(null);
        }}
        onSelect={handleSelectOpenMode}
      />

      <EditFolderNameDialog
        isOpen={folderToEdit !== null}
        onClose={() => setFolderToEdit(null)}
        onConfirm={handleEditFolderConfirm}
        currentName={folderToEdit?.name || ''}
      />

      <EditCompetitionNameDialog
        isOpen={competitionToEdit !== null}
        onClose={() => setCompetitionToEdit(null)}
        onConfirm={handleEditCompetitionNameConfirm}
        currentName={competitionToEdit?.name || ''}
      />
    </div>
  );
}