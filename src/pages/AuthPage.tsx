import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, AlertTriangle, Eye, EyeOff, Check, Building2, X, MapPin,
  Globe2, Phone, FileText, Upload, Facebook, Instagram, Twitter, Youtube, Linkedin
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PublicCalendarSearch } from '../components/PublicCalendarSearch';

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Club details for registration
  const [clubName, setClubName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('BE');

  const countries = [
    { code: 'BE', name: 'België' },
    { code: 'NL', name: 'Nederland' },
    { code: 'DE', name: 'Duitsland' },
    { code: 'FR', name: 'Frankrijk' },
    { code: 'GB', name: 'Engeland' },
    { code: 'LU', name: 'Luxemburg' }
  ];

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          setIsCheckingSession(false);
          return;
        }

        if (session) {
          navigate('/');
          return;
        }

        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (!mounted) return;

        if (!refreshError && (await supabase.auth.getSession()).data.session) {
          navigate('/');
          return;
        }

        setIsCheckingSession(false);
      } catch {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setIsCheckingSession(false);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Vul alle velden in');
      setIsLoading(false);
      return;
    }

    if (isRegistering) {
      // Validate club details
      if (!clubName.trim()) {
        setError('Vul de naam van de club in');
        setIsLoading(false);
        return;
      }
      if (!street.trim() || !postalCode.trim() || !city.trim()) {
        setError('Vul het volledige adres van de club in');
        setIsLoading(false);
        return;
      }

      try {
        // Check if club already exists
        const { data: existingClubs } = await supabase
          .from('club_details')
          .select('name')
          .ilike('name', clubName.trim());

        if (existingClubs && existingClubs.length > 0) {
          setError('Er bestaat al een club met deze naam');
          setIsLoading(false);
          return;
        }

        // Create user account
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password
        });
        
        if (signUpError) throw signUpError;
        if (!user) throw new Error('No user returned after signup');

        // Create club details
        const { error: clubError } = await supabase
          .from('club_details')
          .insert([{
            user_id: user.id,
            name: clubName.trim(),
            street: street.trim(),
            postal_code: postalCode.trim(),
            city: city.trim(),
            country,
            phone_numbers: []
          }]);

        if (clubError) throw clubError;

        // Show success message and switch to login mode
        setIsRegistering(false);
        setPassword('');
        setSuccess('Account aangemaakt! U kunt nu inloggen.');
        
        // Reset club details
        setClubName('');
        setStreet('');
        setPostalCode('');
        setCity('');
        setCountry('BE');
      } catch (err) {
        let errorMessage = 'Er is een fout opgetreden';
        
        if (err instanceof Error) {
          if (err.message.includes('Invalid email')) {
            errorMessage = 'Ongeldig e-mailadres';
          } else if (err.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'Wachtwoord moet minimaal 6 tekens bevatten';
          } else if (err.message.includes('User already registered')) {
            errorMessage = 'Dit e-mailadres is al geregistreerd';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      }
    } else {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });
        
        if (error) throw error;
      } catch (err) {
        let errorMessage = 'Er is een fout opgetreden';
        
        if (err instanceof Error) {
          if (err.message.includes('Invalid login credentials')) {
            errorMessage = 'Ongeldige inloggegevens';
          } else if (err.message.includes('Email not confirmed')) {
            errorMessage = 'E-mailadres is nog niet bevestigd';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      }
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      setError('Vul uw e-mailadres in');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) throw error;

      setSuccess('Er is een e-mail verstuurd met instructies om uw wachtwoord te resetten');
      setResetEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
      }, 3000);
    } catch (err) {
      setError('Er is een fout opgetreden bij het versturen van de reset e-mail');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowLoginForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Building2 size={20} />
            Inloggen voor clubs
          </button>
        </div>

        <PublicCalendarSearch />

        {showLoginForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {isRegistering ? 'Account aanmaken' : 'Inloggen'}
                </h2>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setError(null);
                    setSuccess(null);
                    setEmail('');
                    setPassword('');
                    setIsRegistering(false);
                    setClubName('');
                    setStreet('');
                    setPostalCode('');
                    setCity('');
                    setCountry('BE');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg flex items-center gap-2">
                  <Check size={20} />
                  <span>{success}</span>
                </div>
              )}

              {showForgotPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      E-mailadres
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={20} className="text-gray-400" />
                      </div>
                      <input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="uw@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                    >
                      {isLoading ? 'Even geduld...' : 'Verstuur reset e-mail'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Terug naar inloggen
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-mailadres
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={20} className="text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="uw@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Wachtwoord
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={20} className="text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {isRegistering && (
                    <div className="space-y-6 border-t pt-6">
                      <div>
                        <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 mb-1">
                          Club naam
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 size={20} className="text-gray-400" />
                          </div>
                          <input
                            id="clubName"
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Naam van de club"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                          Straat en nummer
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin size={20} className="text-gray-400" />
                           </div>
                          <input
                            id="street"
                            type="text"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Straat en huisnummer"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                            Postcode
                          </label>
                          <input
                            id="postalCode"
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Postcode"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            Stad
                          </label>
                          <input
                            id="city"
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Stad"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Land
                        </label>
                        <select
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {countries.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                    >
                      {isLoading ? 'Even geduld...' : (isRegistering ? 'Account aanmaken' : 'Inloggen')}
                    </button>

                    {!isRegistering && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="w-full text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Wachtwoord vergeten?
                      </button>
                    )}

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setError(null);
                          setSuccess(null);
                          setPassword('');
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {isRegistering ? 'Al een account? Log in' : 'Nog geen account? Maak er een aan'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}