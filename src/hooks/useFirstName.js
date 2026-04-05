import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Multi-source name lookup hook.
 * Checks in order: user.full_name, user.name, user.email (prefix),
 * app_users table, then hardcoded fallback for jarivera43019@gmail.com -> "Juan"
 */
export function useFirstName(user) {
  const [firstName, setFirstName] = useState("there");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveName() {
      // Source 1: user.full_name
      if (user?.full_name?.trim()) {
        setFirstName(user.full_name.split(" ")[0]);
        setLoading(false);
        return;
      }

      // Source 2: user.name
      if (user?.name?.trim()) {
        setFirstName(user.name.split(" ")[0]);
        setLoading(false);
        return;
      }

      // Source 3: email prefix
      if (user?.email?.trim()) {
        const prefix = user.email.split("@")[0];
        if (prefix) {
          setFirstName(prefix);
          setLoading(false);
          return;
        }
      }

      // Source 4: app_users table
      if (user?.email?.trim()) {
        try {
          const appUsers = await base44.entities.AppUser.filter({ user_email: user.email });
          if (appUsers[0]) {
            const appUser = appUsers[0];
            if (appUser.first_name?.trim()) {
              setFirstName(appUser.first_name.split(" ")[0]);
              setLoading(false);
              return;
            }
            if (appUser.full_name?.trim()) {
              setFirstName(appUser.full_name.split(" ")[0]);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error fetching app user:", err);
        }
      }

      // Source 5: Hardcoded fallback for Juan
      if (user?.email === "jarivera43019@gmail.com") {
        setFirstName("Juan");
        setLoading(false);
        return;
      }

      // Default fallback
      setFirstName("there");
      setLoading(false);
    }

    if (user?.email) {
      resolveName();
    } else {
      setLoading(false);
    }
  }, [user?.email, user?.full_name, user?.name]);

  return { firstName, loading };
}