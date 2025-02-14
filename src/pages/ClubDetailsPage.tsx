import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Save, Plus, Trash2, Phone, FileText, Upload, X, Mail, Globe2, 
  AlertTriangle, Facebook, Instagram, Twitter, Youtube, Linkedin
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PhoneNumber {
  countryCode: string;
  number: string;
}

interface SocialMediaLink {
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'linkedin';
  url: string;
}

interface ClubDetails {
  id: string;
  user_id: string;
  name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  phone_numbers: PhoneNumber[];
  social_media: SocialMediaLink[];
  rules_file_url?: string;
  website?: string;
  email?: string;
  public_name: boolean;
  public_address: boolean;
  public_phone: boolean;
  public_rules: boolean;
  public_website: boolean;
  public_email: boolean;
  public_social_media: boolean;
}

const socialMediaPlatforms = [
  { id: 'facebook' as const, label: 'Facebook', icon: Facebook },
  { id: 'instagram' as const, label: 'Instagram', icon: Instagram },
  { id: 'twitter' as const, label: 'Twitter', icon: Twitter },
  { id: 'youtube' as const, label: 'YouTube', icon: Youtube },
  { id: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin }
];

const phoneCountryCodes = [
  { code: '+32', country: 'BE', label: 'België (+32)' },
  { code: '+31', country: 'NL', label: 'Nederland (+31)' },
  { code: '+49', country: 'DE', label: 'Duitsland (+49)' },
  { code: '+33', country: 'FR', label: 'Frankrijk (+33)' },
  { code: '+44', country: 'GB', label: 'Engeland (+44)' },
  { code: '+352', country: 'LU', label: 'Luxemburg (+352)' }
];

const countries = [
  { code: 'BE', name: 'België' },
  { code: 'NL', name: 'Nederland' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'GB', name: 'Engeland' },
  { code: 'LU', name: 'Luxemburg' }
];

export function ClubDetailsPage() {
  const navigate = useNavigate();
  const [details, setDetails] = useState<ClubDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadClubDetails();
  }, []);

  const loadClubDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('club_details')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Transform phone numbers to new format if they're in old format
        const transformedPhoneNumbers = data.phone_numbers.map((phone: string | PhoneNumber) => {
          if (typeof phone === 'string') {
            return {
              countryCode: '+32', // Default to Belgium
              number: phone
            };
          }
          return phone;
        });

        setDetails({
          ...data,
          phone_numbers: transformedPhoneNumbers,
          social_media: data.social_media || []
        });
      } else {
        // Initialize with empty details
        setDetails({
          id: '',
          user_id: user.id,
          name: '',
          street: '',
          postal_code: '',
          city: '',
          country: 'BE',
          phone_numbers: [],
          social_media: [],
          public_name: false,
          public_address: false,
          public_phone: false,
          public_rules: false,
          public_website: false,
          public_email: false,
          public_social_media: false
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading club details');
      console.error('Error loading club details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoneNumber = () => {
    if (!details) return;
    setDetails({
      ...details,
      phone_numbers: [...details.phone_numbers, { countryCode: '+32', number: '' }]
    });
  };

  const updatePhoneNumber = (index: number, field: keyof PhoneNumber, value: string) => {
    if (!details) return;
    const newPhoneNumbers = [...details.phone_numbers];
    newPhoneNumbers[index] = {
      ...newPhoneNumbers[index],
      [field]: value
    };
    setDetails({
      ...details,
      phone_numbers: newPhoneNumbers
    });
  };

  const removePhoneNumber = (index: number) => {
    if (!details) return;
    setDetails({
      ...details,
      phone_numbers: details.phone_numbers.filter((_, i) => i !== index)
    });
  };

  const addSocialMediaLink = () => {
    if (!details) return;
    setDetails({
      ...details,
      social_media: [
        ...details.social_media,
        { platform: 'facebook', url: '' }
      ]
    });
  };

  const updateSocialMediaLink = (index: number, updates: Partial<SocialMediaLink>) => {
    if (!details) return;
    const newSocialMedia = [...details.social_media];
    newSocialMedia[index] = { ...newSocialMedia[index], ...updates };
    setDetails({
      ...details,
      social_media: newSocialMedia
    });
  };

  const removeSocialMediaLink = (index: number) => {
    if (!details) return;
    setDetails({
      ...details,
      social_media: details.social_media.filter((_, i) => i !== index)
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Selecteer een geldig PDF bestand');
      setSelectedFile(null);
      e.target.value = '';
    }
  };

  const uploadRules = async () => {
    if (!selectedFile || !details) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Delete existing file if there is one
      if (details.rules_file_url) {
        const existingPath = details.rules_file_url.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('club-files')
            .remove([`${user.id}/${existingPath}`]);
        }
      }

      // Upload new file
      const fileName = `rules_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('club-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('club-files')
        .getPublicUrl(filePath);

      // Update details with new URL
      setDetails(prev => prev ? {
        ...prev,
        rules_file_url: publicUrl
      } : null);
      
      setSelectedFile(null);
      setError(null);
    } catch (err) {
      setError('Er is een fout opgetreden bij het uploaden van het bestand');
      console.error('Error uploading rules:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeRules = async () => {
    if (!details?.rules_file_url) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const filePath = details.rules_file_url.split('/').pop();
      if (!filePath) return;

      const { error } = await supabase.storage
        .from('club-files')
        .remove([`${user.id}/${filePath}`]);

      if (error) throw error;

      setDetails(prev => prev ? {
        ...prev,
        rules_file_url: undefined
      } : null);
    } catch (err) {
      setError('Er is een fout opgetreden bij het verwijderen van het bestand');
      console.error('Error removing rules:', err);
    }
  };

  const handleSave = async () => {
    if (!details) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      if (details.id) {
        // Update existing record
        const { error } = await supabase
          .from('club_details')
          .update({
            name: details.name,
            street: details.street,
            postal_code: details.postal_code,
            city: details.city,
            country: details.country,
            phone_numbers: details.phone_numbers,
            social_media: details.social_media,
            rules_file_url: details.rules_file_url,
            website: details.website,
            email: details.email,
            public_name: details.public_name,
            public_address: details.public_address,
            public_phone: details.public_phone,
            public_rules: details.public_rules,
            public_website: details.public_website,
            public_email: details.public_email,
            public_social_media: details.public_social_media
          })
          .eq('id', details.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('club_details')
          .insert([{
            user_id: user.id,
            name: details.name,
            street: details.street,
            postal_code: details.postal_code,
            city: details.city,
            country: details.country,
            phone_numbers: details.phone_numbers,
            social_media: details.social_media,
            rules_file_url: details.rules_file_url,
            website: details.website,
            email: details.email,
            public_name: details.public_name,
            public_address: details.public_address,
            public_phone: details.public_phone,
            public_rules: details.public_rules,
            public_website: details.public_website,
            public_email: details.public_email,
            public_social_media: details.public_social_media
          }]);

        if (error) throw error;
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setError(null);
      
      // Reload details to get the updated record
      loadClubDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving club details');
      console.error('Error saving club details:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Save size={20} />
          Opslaan
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Club gegevens</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {showSaveSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg">
          Gegevens succesvol opgeslagen!
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Club naam
            </label>
            <input
              type="text"
              value={details?.name || ''}
              onChange={(e) => setDetails(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naam van de club"
            />
          </div>
          <div className="flex items-center h-[42px] pt-7">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_name || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_name: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-grow space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straat en nummer
              </label>
              <input
                type="text"
                value={details?.street || ''}
                onChange={(e) => setDetails(prev => prev ? { ...prev, street: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Straat en huisnummer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={details?.postal_code || ''}
                  onChange={(e) => setDetails(prev => prev ? { ...prev, postal_code: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Postcode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stad
                </label>
                <input
                  type="text"
                  value={details?.city || ''}
                  onChange={(e) => setDetails(prev => prev ? { ...prev, city: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Stad"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land
              </label>
              <select
                value={details?.country || 'BE'}
                onChange={(e) => setDetails(prev => prev ? { ...prev, country: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center h-[42px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_address || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_address: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Telefoonnummers
              </label>
              <button
                onClick={addPhoneNumber}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                Voeg nummer toe
              </button>
            </div>
            <div className="space-y-2">
              {details?.phone_numbers.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-grow flex items-center gap-2">
                    <div className="flex-shrink-0 w-40">
                      <select
                        value={phone.countryCode}
                        onChange={(e) => updatePhoneNumber(index, 'countryCode', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      >
                        {phoneCountryCodes.map(code => (
                          <option key={code.code} value={code.code}>
                            {code.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-grow flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                      <Phone size={16} className="text-gray-400" />
                      <input
                        type="tel"
                        value={phone.number}
                        onChange={(e) => updatePhoneNumber(index, 'number', e.target.value)}
                        className="flex-grow bg-transparent focus:outline-none"
                        placeholder="Telefoonnummer"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removePhoneNumber(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center h-[42px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_phone || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_phone: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
              <Globe2 size={16} className="text-gray-400" />
              <input
                type="url"
                value={details?.website || ''}
                onChange={(e) => setDetails(prev => prev ? { ...prev, website: e.target.value } : null)}
                className="flex-grow bg-transparent focus:outline-none"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
          <div className="flex items-center h-[42px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_website || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_website: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
              <Mail size={16} className="text-gray-400" />
              <input
                type="email"
                value={details?.email || ''}
                onChange={(e) => setDetails(prev => prev ? { ...prev, email: e.target.value } : null)}
                className="flex-grow bg-transparent focus:outline-none"
                placeholder="info@example.com"
              />
            </div>
          </div>
          <div className="flex items-center h-[42px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_email || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_email: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Sociale Media
              </label>
              <button
                onClick={addSocialMediaLink}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                Voeg sociale media toe
              </button>
            </div>
            <div className="space-y-2">
              {details?.social_media.map((link, index) => {
                const platform = socialMediaPlatforms.find(p => p.id === link.platform);
                const Icon = platform?.icon || Globe2;
                
                return (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialMediaLink(index, { 
                        platform: e.target.value as SocialMediaLink['platform'] 
                      })}
                      className="w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {socialMediaPlatforms.map(platform => (
                        <option key={platform.id} value={platform.id}>
                          {platform.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex-grow flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                      <Icon size={16} className="text-gray-400" />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateSocialMediaLink(index, { url: e.target.value })}
                        className="flex-grow bg-transparent focus:outline-none"
                        placeholder={`${platform?.label} URL`}
                      />
                    </div>
                    <button
                      onClick={() => removeSocialMediaLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center h-[42px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_social_media || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_social_media: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Club reglement
            </label>
            
            {details?.rules_file_url ? (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <FileText size={24} className="text-gray-500" />
                <div className="flex-grow">
                  <a 
                    href={details.rules_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Bekijk reglement
                  </a>
                </div>
                <button
                  onClick={removeRules}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Verwijder reglement"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="rules-upload"
                />
                {selectedFile ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <FileText size={24} className="text-gray-500" />
                    <span className="flex-grow truncate">{selectedFile.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-md"
                        title="Annuleer"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={uploadRules}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                      >
                        <Upload size={16} />
                        {isUploading ? 'Uploaden...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="rules-upload"
                    className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <Upload size={20} className="text-gray-500" />
                    <span className="text-gray-600">
                      Klik hier om het reglement te uploaden (PDF)
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center h-[42px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.public_rules || false}
                onChange={(e) => setDetails(prev => prev ? { ...prev, public_rules: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Openbaar</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}