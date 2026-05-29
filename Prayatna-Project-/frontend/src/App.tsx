import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PublicPortal from './pages/PublicPortal';
import AmbulancePortal from './pages/AmbulancePortal';
import HospitalPortal from './pages/HospitalPortal';
import AuthPage from './pages/AuthPage';
import SuperAdmin from './pages/SuperAdmin';
import LifeLinkChatbot from './components/LifeLinkChatbot';
import VideoIntro from './components/VideoIntro';

// Reads persisted auth from sessionStorage (per-tab — each tab is independent)
function getStoredUser() {
  try {
    const u = sessionStorage.getItem('lifelink_user');
    const t = sessionStorage.getItem('lifelink_token');
    if (u && t) return JSON.parse(u);
  } catch {}
  return null;
}

const ROLE_PATHS: Record<string, string> = {
  patient: '/',
  hospital_admin: '/hospital',
  ambulance_driver: '/ambulance',
};

function AppInner() {
  const [user, setUser] = useState<any>(getStoredUser);
  const navigate = useNavigate();

  const handleAuth = (userData: any) => {
    setUser(userData);
    const dest = ROLE_PATHS[userData.userType] || '/';
    navigate(dest, { replace: true });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lifelink_token');
    sessionStorage.removeItem('lifelink_user');
    setUser(null);
    navigate('/auth', { replace: true });
  };

  // If user is authenticated, inject logout globally so portal header buttons can call it
  useEffect(() => {
    if (user) {
      (window as any).__lifeLinkLogout = handleLogout;
    }
  }, [user]);

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage onAuth={handleAuth} />} />
        <Route path="/admin" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const userType = user.userType;

  return (
    <Routes>
      {/* Admin route — always accessible regardless of auth */}
      <Route path="/admin" element={<SuperAdmin />} />
      {/* Patient → Public Portal */}
      <Route
        path="/"
        element={userType === 'patient' ? <PublicPortal /> : <Navigate to={ROLE_PATHS[userType] || '/auth'} replace />}
      />
      {/* Hospital Admin → Hospital Portal */}
      <Route
        path="/hospital"
        element={userType === 'hospital_admin' ? <HospitalPortal /> : <Navigate to={ROLE_PATHS[userType] || '/auth'} replace />}
      />
      {/* Ambulance Driver → Ambulance Portal */}
      <Route
        path="/ambulance"
        element={userType === 'ambulance_driver' ? <AmbulancePortal /> : <Navigate to={ROLE_PATHS[userType] || '/auth'} replace />}
      />
      {/* Auth page (redirect if already logged in) */}
      <Route path="/auth" element={<Navigate to={ROLE_PATHS[userType] || '/'} replace />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROLE_PATHS[userType] || '/'} replace />} />
    </Routes>
  );
}

function ChatbotWrapper() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <LifeLinkChatbot />;
}

function App() {
  const [introDone, setIntroDone] = useState(
    () => !!sessionStorage.getItem('ll_intro_done')
  );
  return (
    <Router>
      {!introDone && <VideoIntro onDone={() => setIntroDone(true)} />}
      <AppInner />
      <ChatbotWrapper />
    </Router>
  );
}

export default App;
