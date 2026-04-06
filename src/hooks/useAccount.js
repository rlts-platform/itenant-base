import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const VALID_ROLES = ['platform_owner', 'client', 'team_member', 'tenant'];

export function useAccount() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setAccountLoading(false); return; }

    if (!VALID_ROLES.includes(user.role)) {
      console.warn('[SECURITY] useAccount: unrecognized role, denying data access', { email: user.email, role: user.role });
      setAccountId(null);
      setAccountLoading(false);
      return;
    }

    base44.entities.AppUser.filter({ user_email: user.email }).then(records => {
      const record = records[0];
      if (!record) {
        console.warn('[SECURITY] useAccount: no AppUser record found for', user.email);
        setAccountId(null);
        setAccountLoading(false);
        return;
      }
      setAccountId(record.account_id || null);
      setAccountLoading(false);
    });
  }, [user?.email, user?.role]);

  return { accountId, accountLoading };
}