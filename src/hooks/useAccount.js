import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export function useAccount() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setAccountLoading(false); return; }
    base44.entities.AppUser.filter({ user_email: user.email }).then(records => {
      setAccountId(records[0]?.account_id || null);
      setAccountLoading(false);
    });
  }, [user?.email]);

  return { accountId, accountLoading };
}