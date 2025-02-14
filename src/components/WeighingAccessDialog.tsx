import React, { useState } from 'react';
import { X, Share2, AlertTriangle, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WeighingAccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  sectors: string[];
}

export function WeighingAccessDialog({ isOpen, onClose, competitionId, sectors }: WeighingAccessDialogProps) {
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [expiresIn, setExpiresIn] = useState('24');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setAccessLink(null);

    try {
      // Validate competition ID
      if (!competitionId) {
        throw new Error('Ongeldige wedstrijd ID');
      }

      if (selectedSectors.length === 0) {
        throw new Error('Selecteer ten minste één sector');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Calculate expiration date
      const hours = parseInt(expiresIn, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      const { data, error: insertError } = await supabase
        .from('weighing_access_links')
        .insert({
          competition_id: competitionId,
          sectors: selectedSectors,
          email: user.email,
          expires_at: expiresAt.toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate access link
      const accessLink = `${window.location.origin}/weging/access?access=${data.id}`;
      setAccessLink(accessLink);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!accessLink) return;

    try {
      await navigator.clipboard.writeText(accessLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      setError('Kon de link niet kopiëren. Probeer het handmatig te kopiëren.');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedSectors([]);
    setExpiresIn('24');
    setAccessLink(null);
    setShowSuccess(false);
    setLinkCopied(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Weging toegang verlenen</h2>
          <button
            onClick={handleClose}
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

        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
            Toegang is succesvol aangemaakt!
          </div>
        )}

        {accessLink ? (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-blue-700">Toegangslink:</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check size={16} />
                      Gekopieerd!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Kopieer link
                    </>
                  )}
                </button>
              </div>
              <div className="text-sm text-blue-600 break-all">
                {accessLink}
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {linkCopied ? (
                <>
                  <Check size={20} />
                  Link gekopieerd!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Kopieer link naar klembord
                </>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecteer sectoren
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sectors.map((sector) => (
                  <label
                    key={sector}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                      selectedSectors.includes(sector)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sector)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSectors([...selectedSectors, sector]);
                        } else {
                          setSelectedSectors(selectedSectors.filter(s => s !== sector));
                        }
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Sector {sector}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-700 mb-1">
                Toegang verloopt na
              </label>
              <select
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2">2 uur</option>
                <option value="4">4 uur</option>
                <option value="8">8 uur</option>
                <option value="12">12 uur</option>
                <option value="24">24 uur</option>
                <option value="48">48 uur</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                <Share2 size={20} />
                {isLoading ? 'Genereren...' : 'Genereer link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}