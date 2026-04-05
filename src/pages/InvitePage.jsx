import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState("loading"); // loading | valid | expired | invalid | accepting | done | error
  const [invite, setInvite] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function init() {
      // Check auth status
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }

      // Validate token
      const res = await base44.functions.invoke("validateInviteToken", { token });
      const data = res.data;
      if (data.valid) {
        setInvite(data.invite);
        setTenant(data.tenant);
        setState("valid");
      } else if (data.reason === "expired") {
        setState("expired");
      } else if (data.reason === "already_accepted") {
        setState("done");
      } else {
        setState("invalid");
      }
    }
    init();
  }, [token]);

  // If logged in and token is valid, auto-accept
  useEffect(() => {
    if (state === "valid" && isLoggedIn && currentUser) {
      handleAccept();
    }
  }, [state, isLoggedIn, currentUser]);

  const handleAccept = async () => {
    setState("accepting");
    const res = await base44.functions.invoke("acceptTenantInvite", { token });
    const data = res.data;
    if (data.success) {
      setState("done");
      setTimeout(() => {
        window.location.href = "/tenant";
      }, 1500);
    } else {
      setErrorMsg(data.error || "Something went wrong");
      setState("error");
    }
  };

  const handleSignIn = () => {
    base44.auth.redirectToLogin(`/invite/${token}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-5 shadow-md">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">iTenant</h1>

        {state === "loading" && (
          <div className="mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-3">Validating your invitation…</p>
          </div>
        )}

        {state === "accepting" && (
          <div className="mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-3">Setting up your account…</p>
          </div>
        )}

        {state === "valid" && !isLoggedIn && (
          <div className="mt-4">
            <p className="text-muted-foreground mb-6">
              Hi <strong>{tenant?.first_name}</strong>! Your property manager has invited you to manage your rental account on iTenant.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left text-sm text-blue-800">
              <p><span className="font-semibold">Email:</span> {invite?.email}</p>
              {tenant && <p className="mt-1"><span className="font-semibold">Name:</span> {tenant.first_name} {tenant.last_name}</p>}
            </div>
            <Button className="w-full rounded-xl" size="lg" onClick={handleSignIn}>
              Accept Invitation & Sign In
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              You'll be asked to sign in or create an account with <strong>{invite?.email}</strong>
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-6">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900">You're all set!</h2>
            <p className="text-muted-foreground mt-2">Redirecting you to your dashboard…</p>
          </div>
        )}

        {state === "expired" && (
          <div className="mt-6">
            <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Invitation Expired</h2>
            <p className="text-muted-foreground mt-2 text-sm">This invitation link has expired. Please ask your property manager to resend the invite.</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="mt-6">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Invalid Link</h2>
            <p className="text-muted-foreground mt-2 text-sm">This invitation link is not valid. Please contact your property manager.</p>
          </div>
        )}

        {state === "error" && (
          <div className="mt-6">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Error</h2>
            <p className="text-muted-foreground mt-2 text-sm">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}