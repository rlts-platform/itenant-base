import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
import LandingPage from './pages/LandingPage';
import SignaturePage from './pages/SignaturePage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const navigate = useNavigate();

  // Public routes — skip auth enforcement (checked after hooks)

  // Role-based redirect after login
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings && user && !authError) {
      const role = user.role;
      const path = window.location.pathname;
      if (role === 'platform_owner' && !path.startsWith('/owner')) {
        navigate('/owner', { replace: true });
      } else if (role === 'tenant' && !path.startsWith('/tenant')) {
        navigate('/tenant', { replace: true });
      } else if (role !== 'platform_owner' && role !== 'tenant' && (path.startsWith('/owner') || path.startsWith('/tenant'))) {
        navigate('/', { replace: true });
      }
    }
  }, [isLoadingAuth, isLoadingPublicSettings, user, authError]);

  // Public routes checked after hooks
  if (window.location.pathname.startsWith('/apply/')) return <ApplyPage />;

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#F4F3FF' }}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      if (window.location.pathname === '/' || window.location.pathname === '/landing') {
        return <LandingPage />;
      }
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
  <Routes>
    {/* Standalone public routes — no sidebar */}
    <Route path="/landing" element={<LandingPage />} />
    <Route path="/sign/:token" element={<SignaturePage />} />
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
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App