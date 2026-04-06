import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_LABELS = {
  manager: "Manager — full account access",
  maintenance: "Maintenance — work orders & vendors",
  leasing: "Leasing Agent — properties, tenants & leases",
  accountant: "Accountant — payments & financials",
  readonly: "Read Only — view all data",
};

export default function TeamInvitePage() {
  const { token } = useParams();
  const [state, setState] = useState("loading");
  const [member, setMember] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function init() {
      try {
        await base44.auth.me();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }

      // Validate token by looking up the team member
      const res = await base44.functions.invoke("validateTeamInviteToken", { token });
      const data = res.data;
      if (data.valid) {
        setMember(data.member);
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

  // If already logged in and token is valid, auto-accept
  useEffect(() => {
    if (state === "valid" && isLoggedIn) {
      handleAccept();
    }
  }, [state, isLoggedIn]);

  const handleAccept = async () => {
    setState("accepting");
    const res = await base44.functions.invoke("acceptTeamMemberInvite", { token });
    const data = res.data;
    if (data.success) {
      setState("done");
      setTimeout(() => { window.location.href = "/"; }, 1800);
    } else {
      setErrorMsg(data.error || "Something went wrong");
      setState("error");
    }
  };

  const handleSignIn = () => {
    base44.auth.redirectToLogin(`/team-invite/${token}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F4F3FF" }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-border">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md" style={{ background: "#7C6FCD" }}>
          <Users2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1A2E" }}>iTenant</h1>

        {state === "loading" && (
          <div className="mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-3">Validating your invitation…</p>
          </div>
        )}

        {state === "accepting" && (
          <div className="mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-3">Setting up your team access…</p>
          </div>
        )}

        {state === "valid" && !isLoggedIn && (
          <div className="mt-4">
            <p className="text-muted-foreground mb-4">
              <strong>{member?.name}</strong>, you've been invited to join a property management team on iTenant.
            </p>
            {member?.team_role && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-sm text-left">
                <p className="font-semibold text-primary mb-1">Your Role</p>
                <p className="text-foreground">{ROLE_LABELS[member.team_role] || member.team_role}</p>
              </div>
            )}
            <Button className="w-full rounded-xl" size="lg" onClick={handleSignIn}>
              Accept Invitation & Sign In
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              You'll sign in or create an account with <strong>{member?.email}</strong>
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-6">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">You're all set!</h2>
            <p className="text-muted-foreground mt-2">Redirecting you to the dashboard…</p>
          </div>
        )}

        {state === "expired" && (
          <div className="mt-6">
            <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Invitation Expired</h2>
            <p className="text-muted-foreground mt-2 text-sm">This invitation has expired. Please ask the account owner to resend it.</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="mt-6">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Invalid Link</h2>
            <p className="text-muted-foreground mt-2 text-sm">This invitation link is not valid.</p>
          </div>
        )}

        {state === "error" && (
          <div className="mt-6">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Error</h2>
            <p className="text-muted-foreground mt-2 text-sm">{errorMsg}</p>
            <Button className="mt-4" onClick={handleSignIn}>Try Signing In Again</Button>
          </div>
        )}
      </div>
    </div>
  );
}