import { useEffect } from 'react';
import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { base44 } from '@/api/base44Client';
import Logo from './components/Logo';
import Layout from './components/Layout';
import ClientDashboard from './pages/ClientDashboard';
import Properties from './pages/Properties';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
import Leases from './pages/Leases';
import Maintenance from './pages/Maintenance';
import Payments from './pages/Payments';
import Financials from './pages/Financials';
import Documents from './pages/Documents';
import Messages from './pages/Messages';
import Vendors from './pages/Vendors';
import Automations from './pages/Automations';
import Settings from './pages/Settings';
import OwnerDashboard from './pages/OwnerDashboard';
import Onboarding from './pages/Onboarding';
import TenantDashboard from './pages/TenantDashboard';
import TenantPay from './pages/TenantPay';
import TenantMaintenance from './pages/TenantMaintenance';
import TenantDocuments from './pages/TenantDocuments';
import TenantMessages from './pages/TenantMessages';
import TenantCommunity from './pages/TenantCommunity';
import TenantProfile from './pages/TenantProfile';
import InvitePage from './pages/InvitePage';
import Team from './pages/Team';
import Assistant from './pages/Assistant';
import Reports from './pages/Reports';
import OwnerRevenue from './pages/OwnerRevenue';
import OwnerClients from './pages/OwnerClients';
import ApplyPage from './pages/ApplyPage';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import TeamInvitePage from './pages/TeamInvitePage';
import LandingPage from './pages/LandingPage';
import SignaturePage from './pages/SignaturePage';
import Analytics from './pages/Analytics';
import RecurringTasks from './pages/RecurringTasks';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const navigate = useNavigate();
  const [appUser, setAppUser] = React.useState(null);
  const [checkingUser, setCheckingUser] = React.useState(true);

  // Public routes — skip auth enforcement (checked after hooks)

  // After auth, check app_users table for new vs returning + onboarding status
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings && user && !authError) {
      (async () => {
        try {
          const existing = await base44.entities.AppUser.filter({ user_email: user.email });
          if (existing.length === 0) {
            // New user — send to onboarding
            setAppUser(null);
            navigate('/onboarding', { replace: true });
          } else {
            const appUserRecord = existing[0];
            setAppUser(appUserRecord);
            if (!appUserRecord.onboarding_complete) {
              // Incomplete onboarding — send back
              navigate('/onboarding', { replace: true });
            } else {
              // Returning user with complete onboarding — redirect by role
              const role = appUserRecord.role;
              const path = window.location.pathname;
              if (role === "platform_owner" && !path.startsWith("/owner")) {
                navigate("/owner", { replace: true });
              } else if (role === "tenant" && (path === "/" || path === "/landing" || !path.startsWith("/tenant"))) {
                navigate("/tenant", { replace: true });
              } else if (role === "client" && (path === "/" || path === "/landing")) {
                navigate("/", { replace: true });
              } else if (role !== "client" && path === "/") {
                // Authenticated user on / but not client — redirect by role
                navigate(role === "tenant" ? "/tenant" : role === "platform_owner" ? "/owner" : "/", { replace: true });
              }
            }
          }
        } catch (err) {
          console.error("Error checking app user:", err);
        } finally {
          setCheckingUser(false);
        }
      })();
    } else if (!isLoadingAuth && !isLoadingPublicSettings && !user) {
      setCheckingUser(false);
    }
  }, [isLoadingAuth, isLoadingPublicSettings, user, authError]);

  // Show loading during app user check
  if (checkingUser && user && !authError && !isLoadingAuth && !isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#F4F3FF' }}>
        <div className="mb-6">
          <Logo variant="icon" size="lg" />
        </div>
        <style>{`
          @keyframes pulse-scale {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
          .logo-pulse svg { animation: pulse-scale 2s ease-in-out infinite; }
        `}</style>
        <div className="logo-pulse">
          <Logo variant="icon" size="lg" />
        </div>
      </div>
    );
  }

  // Public routes checked after hooks
  if (window.location.pathname.startsWith('/apply/')) return <ApplyPage />;

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#F4F3FF' }}>
        <style>{`
          @keyframes pulse-scale {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
          .logo-pulse svg { animation: pulse-scale 2s ease-in-out infinite; }
        `}</style>
        <div className="logo-pulse">
          <Logo variant="icon" size="lg" />
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Always show landing page for unauthenticated users
      return <LandingPage />;
    }
  }

  // Render the main app
  return (
  <Routes>
    {/* Standalone public routes — no sidebar */}
    <Route path="/landing" element={<LandingPage />} />
    <Route path="/sign/:token" element={<SignaturePage />} />
    <Route path="/team-invite/:token" element={<TeamInvitePage />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route element={<Layout />}>
      <Route path="/" element={<ClientDashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/units" element={<Units />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/leases" element={<Leases />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/tenant" element={<TenantDashboard />} />
        <Route path="/tenant/pay" element={<TenantPay />} />
        <Route path="/tenant/maintenance" element={<TenantMaintenance />} />
        <Route path="/tenant/documents" element={<TenantDocuments />} />
        <Route path="/tenant/messages" element={<TenantMessages />} />
        <Route path="/tenant/community" element={<TenantCommunity />} />
        <Route path="/tenant/profile" element={<TenantProfile />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/team" element={<Team />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/recurring-tasks" element={<RecurringTasks />} />
        <Route path="/owner/revenue" element={<OwnerRevenue />} />
        <Route path="/owner/clients" element={<OwnerClients />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/apply/:propertyId" element={<ApplyPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <div style={{ color: '#1A1A2E', WebkitTextFillColor: '#1A1A2E' }}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </div>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App