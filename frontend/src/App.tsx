import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/admin/Dashboard';
import CaregiverDashboard from './pages/caregiver/Dashboard';
import CandidateDashboard from './pages/candidate/Dashboard';
import FamilyDashboard from './pages/family/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!profile.onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Auto-redirect to appropriate dashboard if already logged in
  const getDefaultRoute = () => {
    if (!user || !profile) return '/';
    if (!profile.onboarded) return '/onboarding';
    
    switch (profile.role) {
      case 'institute_admin':
        return '/admin/dashboard';
      case 'caregiver':
        return '/caregiver/dashboard';
      case 'candidate':
        return '/candidate/dashboard';
      case 'family_member':
        return '/family/dashboard';
      default:
        return '/';
    }
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['institute_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/caregiver/dashboard"
        element={
          <ProtectedRoute allowedRoles={['caregiver', 'family_member']}>
            <CaregiverDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/family/dashboard"
        element={
          <ProtectedRoute allowedRoles={['family_member']}>
            <FamilyDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

