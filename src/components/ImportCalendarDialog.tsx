import React, { useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { utils, read } from 'xlsx';
import type { CalendarEvent } from '../types';

interface ColumnMapping {
  date: string;
  name: string;
  number_pickup_time: string;
  start_time: string;
  end_time: string;
  postal_code: string;
  city: string;
  country: string;
}

interface ImportCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (events: Partial<CalendarEvent>[]) => void;
}

const parseExcelTime = (value: any): string | undefined => {
  if (!value) return undefined;

  try {
    // If value is already a string in HH:mm format
    if (typeof value === 'string') {
      // Only accept HH:mm format with colon
      const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const [_, hours, minutes] = timeMatch;
        return `${hours.padStart(2, '0')}:${minutes}`;
      }

      // If the time uses a different separator, convert it
      const altTimeMatch = value.match(/^(\d{1,2})[.,](\d{2})$/);
      if (altTimeMatch) {
        const [_, hours, minutes] = altTimeMatch;
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
    }

    // If value is a number (Excel time is a decimal fraction of a day)
    if (typeof value === 'number') {
      // Handle Excel's decimal time format
      const excelBaseDate = new Date(1899, 11, 30); // Excel's base date is December 30, 1899
      const milliseconds = Math.round((value % 1) * 24 * 60 * 60 * 1000);
      const timeDate = new Date(excelBaseDate.getTime() + milliseconds);
      
      const hours = timeDate.getHours();
      const minutes = timeDate.getMinutes();
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // If value is a Date object
    if (value instanceof Date) {
      return `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;
    }

    throw new Error(`Ongeldige tijd: ${value}. Gebruik het formaat HH:mm (bijvoorbeeld 09:00)`);
  } catch (err) {
    console.error('Error parsing time:', err);
    throw new Error(`Ongeldige tijd: ${value}. Gebruik het formaat HH:mm (bijvoorbeeld 09:00)`);
  }
};

const parseExcelDate = (value: any): string | undefined => {
  if (!value) return undefined;

  try {
    // If value is already a Date object
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const day = value.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Handle Excel serial number dates
    if (typeof value === 'number') {
      // Excel dates are counted from December 30, 1899
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    // Handle string dates
    if (typeof value === 'string') {
      // Try parsing as DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
      const parts = value.split(/[/\-.]/).map(part => part.trim());
      if (parts.length === 3) {
        // Assume European date format (DD/MM/YYYY)
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        
        // Add 2000 to two-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        // Validate date parts
        if (isNaN(day) || isNaN(month) || isNaN(year) ||
            day < 1 || day > 31 || month < 1 || month > 12) {
          throw new Error(`Ongeldige datum: ${value}`);
        }

        // Format with dashes
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }

      // Try parsing as a regular date string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    throw new Error(`Ongeldige datum: ${value}. Gebruik het formaat DD-MM-YYYY (bijvoorbeeld 25-12-2025)`);
  } catch (err) {
    console.error('Error parsing date:', err);
    throw new Error(`Ongeldige datum: ${value}. Gebruik het formaat DD-MM-YYYY (bijvoorbeeld 25-12-2025)`);
  }
};

export function ImportCalendarDialog({ isOpen, onClose, onImport }: ImportCalendarDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    name: '',
    number_pickup_time: '',
    start_time: '',
    end_time: '',
    postal_code: '',
    city: '',
    country: ''
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const formatCellValue = (value: any): string => {
    if (value instanceof Date) {
      return value.toLocaleDateString('nl-NL');
    }
    return String(value ?? '');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data, { cellDates: true }); // Enable date parsing
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('Het Excel bestand bevat geen gegevens');
      }

      // Get column headers
      const headers = Object.keys(jsonData[0]);
      setColumns(headers);
      setPreviewData(jsonData.slice(0, 5)); // Show first 5 rows as preview
      setSelectedFile(file);
      setError(null);
    } catch (err) {
      setError('Er is een fout opgetreden bij het lezen van het bestand');
      setSelectedFile(null);
      setColumns([]);
      setPreviewData([]);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      const events: Partial<CalendarEvent>[] = [];

      for (const row of jsonData) {
        try {
          // Parse the date
          const rawDate = mapping.date ? row[mapping.date] : undefined;
          const parsedDate = rawDate ? parseExcelDate(rawDate) : undefined;

          if (!parsedDate) {
            throw new Error(`Ongeldige datum: ${rawDate}`);
          }

          // Parse times
          const rawNumberPickupTime = mapping.number_pickup_time ? row[mapping.number_pickup_time] : undefined;
          const rawStartTime = mapping.start_time ? row[mapping.start_time] : undefined;
          const rawEndTime = mapping.end_time ? row[mapping.end_time] : undefined;

          const parsedNumberPickupTime = rawNumberPickupTime ? parseExcelTime(rawNumberPickupTime) : '08:00';
          const parsedStartTime = rawStartTime ? parseExcelTime(rawStartTime) : '09:00';
          const parsedEndTime = rawEndTime ? parseExcelTime(rawEndTime) : '12:00';

          const event: Partial<CalendarEvent> = {
            id: crypto.randomUUID(),
            date: parsedDate,
            name: mapping.name ? String(row[mapping.name] || '').trim() : undefined,
            type: 'fixed-rod',
            format: 'single',
            access: 'members-only',
            water_type: 'public',
            number_pickup_time: parsedNumberPickupTime,
            start_time: parsedStartTime,
            end_time: parsedEndTime,
            postal_code: mapping.postal_code ? String(row[mapping.postal_code] || '') : '',
            city: mapping.city ? String(row[mapping.city] || '') : '',
            country: mapping.country ? String(row[mapping.country] || 'BE') : 'BE'
          };

          events.push(event);
        } catch (err) {
          console.error('Error processing row:', err);
          setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwerken van een rij');
          return; // Stop processing on first error
        }
      }

      if (events.length === 0) {
        throw new Error('Geen geldige wedstrijden gevonden in het bestand');
      }

      onImport(events);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het importeren van de gegevens');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Importeer wedstrijden</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excel bestand
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload size={20} className="text-gray-500" />
                <span className="text-gray-600">
                  Klik hier om een Excel bestand te uploaden
                </span>
              </label>
            </div>
          </div>

          {/* Column mapping */}
          {columns.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Kolom toewijzing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <select
                    value={mapping.date}
                    onChange={(e) => setMapping(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loting tijd
                  </label>
                  <select
                    value={mapping.number_pickup_time}
                    onChange={(e) => setMapping(prev => ({ ...prev, number_pickup_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start tijd
                  </label>
                  <select
                    value={mapping.start_time}
                    onChange={(e) => setMapping(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eind tijd
                  </label>
                  <select
                    value={mapping.end_time}
                    onChange={(e) => setMapping(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode
                  </label>
                  <select
                    value={mapping.postal_code}
                    onChange={(e) => setMapping(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stad
                  </label>
                  <select
                    value={mapping.city}
                    onChange={(e) => setMapping(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  <select
                    value={mapping.country}
                    onChange={(e) => setMapping(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer kolom</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Voorbeeld (eerste 5 rijen)</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr>
                      {columns.map(col => (
                        <th key={col} className="py-2 px-4 text-left bg-gray-50 border-b">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {columns.map(col => (
                          <td key={col} className="py-2 px-4">
                            {formatCellValue(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || !mapping.date || !mapping.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              Importeren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}