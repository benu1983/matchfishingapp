import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { RodType, CompetitionFormat, AccessType, WaterType } from '../types';

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

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    type?: RodType;
    format?: CompetitionFormat;
    water_type?: WaterType;
    access?: AccessType;
  }) => void;
}

export function BulkEditDialog({ isOpen, onClose, onSave }: BulkEditDialogProps) {
  const [updates, setUpdates] = useState<{
    type?: RodType;
    format?: CompetitionFormat;
    water_type?: WaterType;
    access?: AccessType;
  }>({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bewerk geselecteerde wedstrijden</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type hengel
            </label>
            <select
              value={updates.type || ''}
              onChange={(e) => setUpdates({ ...updates, type: e.target.value as RodType })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Geen wijziging</option>
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
              value={updates.water_type || ''}
              onChange={(e) => setUpdates({ ...updates, water_type: e.target.value as WaterType })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Geen wijziging</option>
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
              value={updates.format || ''}
              onChange={(e) => setUpdates({ ...updates, format: e.target.value as CompetitionFormat })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Geen wijziging</option>
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
              value={updates.access || ''}
              onChange={(e) => setUpdates({ ...updates, access: e.target.value as AccessType })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Geen wijziging</option>
              {accessTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={() => {
              // Filter out empty values
              const filteredUpdates = Object.fromEntries(
                Object.entries(updates).filter(([_, value]) => value !== '')
              );
              
              if (Object.keys(filteredUpdates).length > 0) {
                onSave(filteredUpdates);
              }
              setUpdates({});
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Wijzigingen toepassen
          </button>
        </div>
      </div>
    </div>
  );
}