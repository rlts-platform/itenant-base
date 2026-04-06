import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PAGE_ACCESS = {
  dashboard:   { manager: 'write', maintenance: 'write', leasing: 'write', accountant: 'write', readonly: 'view' },
  properties:  { manager: 'write', maintenance: 'view',  leasing: 'write', accountant: 'none',  readonly: 'view' },
  units:       { manager: 'write', maintenance: 'view',  leasing: 'write', accountant: 'none',  readonly: 'view' },
  tenants:     { manager: 'write', maintenance: 'none',  leasing: 'write', accountant: 'view',  readonly: 'view' },
  leases:      { manager: 'write', maintenance: 'none',  leasing: 'write', accountant: 'view',  readonly: 'view' },
  payments:    { manager: 'write', maintenance: 'none',  leasing: 'none',  accountant: 'write', readonly: 'view' },
  financials:  { manager: 'write', maintenance: 'none',  leasing: 'none',  accountant: 'write', readonly: 'view' },
  maintenance: { manager: 'write', maintenance: 'write', leasing: 'view',  accountant: 'none',  readonly: 'view' },
  vendors:     { manager: 'write', maintenance: 'write', leasing: 'none',  accountant: 'none',  readonly: 'view' },
  documents:   { manager: 'write', maintenance: 'none',  leasing: 'write', accountant: 'write', readonly: 'view' },
  settings:    { manager: 'write', maintenance: 'none',  leasing: 'none',  accountant: 'none',  readonly: 'none' },
  team:        { manager: 'write', maintenance: 'none',  leasing: 'none',  accountant: 'none',  readonly: 'none' },
};

export function usePermissions(page) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamRole, setTeamRole] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    if (user.role !== 'team_member') { setLoaded(true); return; }
    base44.entities.AppUser.filter({ user_email: user.email }).then(records => {
      setTeamRole(records[0]?.team_role || null);
      setLoaded(true);
    });
  }, [user?.email]);

  const access = (loaded && user?.role === 'team_member' && teamRole)
    ? (PAGE_ACCESS[page]?.[teamRole] || 'none')
    : 'write';

  useEffect(() => {
    if (loaded && user?.role === 'team_member' && access === 'none') {
      toast.error("You don't have permission to access this page. Contact your account owner.");
      navigate('/', { replace: true });
    }
  }, [loaded, access]);

  return {
    canAccess: access !== 'none',
    canWrite: access === 'write',
    loaded,
  };
}