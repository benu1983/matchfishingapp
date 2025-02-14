import React, { useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Users, MapPin, Scale, Trophy, History, Home, LogOut, FileText, Calendar, Building2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthPage } from './pages/AuthPage';
import { CompetitionDetailsPage } from './pages/CompetitionDetailsPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { PlacesPage } from './pages/PlacesPage';
import { WeighingPage } from './pages/WeighingPage';
import { WeighingAccessPage } from './pages/WeighingAccessPage';
import { ResultsPage } from './pages/ResultsPage';
import { SavedResultsPage } from './pages/SavedResultsPage';
import { CriteriumStandingsPage } from './pages/CriteriumStandingsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ClubDetailsPage } from './pages/ClubDetailsPage';
import { useCompetitionStore } from './store/competitionStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate('/auth', { replace: true });
          return;
        }

        if (!session) {
          try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              if (refreshError.name === 'AuthApiError' && refreshError.status === 400) {
                // Token is invalid or expired, redirect to auth page
                navigate('/auth', { replace: true });
              } else {
                console.error('Session refresh error:', refreshError);
              }
              setIsAuthenticated(false);
              setIsLoading(false);
              return;
            }

            setIsAuthenticated(!!refreshedSession);
          } catch (refreshErr) {
            console.error('Session refresh error:', refreshErr);
            setIsAuthenticated(false);
            navigate('/auth', { replace: true });
          }
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
        navigate('/auth', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setIsAuthenticated(false);
        navigate('/auth', { replace: true });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsAuthenticated(!!session);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function RequireCompetitionDetails({ children }: { children: React.ReactNode }) {
  const { details } = useCompetitionStore();
  const location = useLocation();
  
  if (location.pathname === '/uitslag' && location.state?.fromSavedResult) {
    return <>{children}</>;
  }
  
  if (!details) {
    return <Navigate to="/wedstrijd" replace />;
  }

  return <>{children}</>;
}

function Navigation() {
  const location = useLocation();
  const { details } = useCompetitionStore();
  const showNavigation = details && location.pathname !== '/';

  if (!showNavigation) return null;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-8 h-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Home size={20} />
            Start
          </Link>
          <Link
            to="/wedstrijd"
            className={`flex items-center gap-2 h-full border-b-2 px-1 transition-colors ${
              location.pathname === '/wedstrijd'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText size={20} />
            Wedstrijd details
          </Link>
          <Link
            to="/deelnemers"
            className={`flex items-center gap-2 h-full border-b-2 px-1 transition-colors ${
              location.pathname === '/deelnemers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={20} />
            Deelnemers
          </Link>
          <Link
            to="/plaatsen"
            className={`flex items-center gap-2 h-full border-b-2 px-1 transition-colors ${
              location.pathname === '/plaatsen'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin size={20} />
            Plaatsen
          </Link>
          <Link
            to="/weging"
            className={`flex items-center gap-2 h-full border-b-2 px-1 transition-colors ${
              location.pathname === '/weging'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Scale size={20} />
            Weging
          </Link>
          <Link
            to="/uitslag"
            className={`flex items-center gap-2 h-full border-b-2 px-1 transition-colors ${
              location.pathname === '/uitslag'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy size={20} />
            Uitslag
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-end mb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            Uitloggen
          </button>
        </div>

        <div className="text-center mb-12 pt-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Hengelsport uitslagen</h1>
          <p className="text-lg text-gray-600">Selecteer een optie om te beginnen</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <Link
            to="/wedstrijd"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                <Users size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Nieuwe wedstrijd</h2>
              <p className="text-gray-600 text-center">
                Start een nieuwe wedstrijd en voer de details in
              </p>
            </div>
          </Link>

          <Link
            to="/uitslagen"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                <History size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Uitslagen</h2>
              <p className="text-gray-600 text-center">
                Bekijk opgeslagen uitslagen van eerdere wedstrijden
              </p>
            </div>
          </Link>

          <Link
            to="/kalender"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
                <Calendar size={32} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Kalender</h2>
              <p className="text-gray-600 text-center">
                Beheer de wedstrijdkalender
              </p>
            </div>
          </Link>

          <Link
            to="/club"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors">
                <Building2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Club gegevens</h2>
              <p className="text-gray-600 text-center">
                Beheer de gegevens van uw club
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          } />
          <Route path="/wedstrijd" element={
            <RequireAuth>
              <CompetitionDetailsPage />
            </RequireAuth>
          } />
          <Route path="/deelnemers" element={
            <RequireAuth>
              <RequireCompetitionDetails>
                <ParticipantsPage />
              </RequireCompetitionDetails>
            </RequireAuth>
          } />
          <Route path="/plaatsen" element={
            <RequireAuth>
              <RequireCompetitionDetails>
                <PlacesPage />
              </RequireCompetitionDetails>
            </RequireAuth>
          } />
          <Route path="/weging" element={
            <RequireAuth>
              <RequireCompetitionDetails>
                <WeighingPage />
              </RequireCompetitionDetails>
            </RequireAuth>
          } />
          <Route path="/weging/access" element={
            <RequireAuth>
              <WeighingAccessPage />
            </RequireAuth>
          } />
          <Route path="/uitslag" element={
            <RequireAuth>
              <RequireCompetitionDetails>
                <ResultsPage />
              </RequireCompetitionDetails>
            </RequireAuth>
          } />
          <Route path="/uitslagen" element={
            <RequireAuth>
              <SavedResultsPage />
            </RequireAuth>
          } />
          <Route path="/tussenstand" element={
            <RequireAuth>
              <CriteriumStandingsPage />
            </RequireAuth>
          } />
          <Route path="/kalender" element={
            <RequireAuth>
              <CalendarPage />
            </RequireAuth>
          } />
          <Route path="/club" element={
            <RequireAuth>
              <ClubDetailsPage />
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}