import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/admin/Dashboard";
import CaregiverDashboard from "./pages/caregiver/Dashboard";
import CandidateDashboard from "./pages/candidate/Dashboard";
import FamilyDashboard from "./pages/family/Dashboard";
import LoadingSpinner from "./components/LoadingSpinner";

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, profile, loading } = useAuth();

  console.log("[ProtectedRoute] Rendering:", {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
    onboarded: profile?.onboarded,
    allowedRoles,
    currentPath: window.location.pathname,
  });

  if (loading) {
    console.log("[ProtectedRoute] Still loading, showing spinner...");
    return <LoadingSpinner />;
  }

  if (!user || !profile) {
    console.log("[ProtectedRoute] No user or profile, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (!profile.onboarded && window.location.pathname !== "/onboarding") {
    console.log(
      "[ProtectedRoute] User not onboarded, redirecting to onboarding"
    );
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    console.log("[ProtectedRoute] User role not allowed, redirecting to home");
    return <Navigate to="/" replace />;
  }

  console.log("[ProtectedRoute] All checks passed, rendering children");
  return <>{children}</>;
};

function App() {
  const { user, profile, loading } = useAuth();

  console.log("[App] Rendering App component:", {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
    onboarded: profile?.onboarded,
    currentPath: window.location.pathname,
  });

  if (loading) {
    console.log("[App] Still loading auth, showing spinner...");
    return <LoadingSpinner />;
  }

  // Auto-redirect to appropriate dashboard if already logged in
  const getDefaultRoute = () => {
    if (!user || !profile) {
      console.log('[App] getDefaultRoute: No user/profile, returning "/"');
      return "/";
    }
    if (!profile.onboarded) {
      console.log(
        '[App] getDefaultRoute: User not onboarded, returning "/onboarding"'
      );
      return "/onboarding";
    }

    let route = "/";
    switch (profile.role) {
      case "institute_admin":
        route = "/admin/dashboard";
        break;
      case "caregiver":
        route = "/caregiver/dashboard";
        break;
      case "candidate":
        route = "/candidate/dashboard";
        break;
      case "family_member":
        route = "/family/dashboard";
        break;
      default:
        route = "/";
    }
    console.log(
      "[App] getDefaultRoute: Returning route for role",
      profile.role,
      ":",
      route
    );
    return route;
  };

  const defaultRoute = getDefaultRoute();
  console.log("[App] Default route calculated:", defaultRoute);

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to={getDefaultRoute()} replace /> : <Landing />
        }
      />
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
          <ProtectedRoute allowedRoles={["institute_admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/caregiver/dashboard"
        element={
          <ProtectedRoute allowedRoles={["caregiver", "family_member"]}>
            <CaregiverDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute allowedRoles={["candidate"]}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/family/dashboard"
        element={
          <ProtectedRoute allowedRoles={["family_member"]}>
            <FamilyDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
