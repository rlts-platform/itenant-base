import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, FileText, PenLine, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignaturePage() {
  const token = window.location.pathname.split("/sign/")[1];
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const [step, setStep] = useState("review"); // review | sign | done | declined
  const [signerName, setSignerName] = useState("");
  const [initials, setInitials] = useState("");
  const [typing, setTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    base44.entities.Document.filter({ signature_token: token }).then(docs => {
      const d = docs[0];
      if (!d) { setNotFound(true); }
      else if (d.signature_status === "signed") { setDoc(d); setAlreadySigned(true); }
      else if (d.signature_status !== "pending") { setNotFound(true); }
      else {
        setDoc(d);
        setSignerName(d.signer_name || "");
      }
      setLoading(false);
    });
  }, [token]);

  const sign = async () => {
    if (!signerName || !initials) return;
    setSubmitting(true);
    const signatureString = `${signerName} — "${initials}" — Signed electronically on ${new Date().toLocaleString()}`;
    await base44.entities.Document.update(doc.id, {
      signature_status: "signed",
      tenant_signature: signatureString,
      signer_name: signerName,
      signed_at: new Date().toISOString(),
    });
    setStep("done");
    setSubmitting(false);
  };

  const decline = async () => {
    setSubmitting(true);
    await base44.entities.Document.update(doc.id, {
      signature_status: "declined",
    });
    setStep("declined");
    setSubmitting(false);
  };

  const containerStyle = {
    minHeight: "100vh",
    background: "#F4F3FF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid rgba(124,111,205,0.15)",
    borderRadius: 20,
    padding: "32px",
    maxWidth: 580,
    width: "100%",
    boxShadow: "0 4px 32px rgba(124,111,205,0.10)",
  };

  if (loading) return (
    <div style={containerStyle}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 80 }}>
        <Loader2 size={32} color="#7C6FCD" className="animate-spin" />
        <p style={{ color: "#6B7280", fontSize: 14 }}>Loading document…</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <AlertTriangle size={40} color="#F59E0B" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontWeight: 800, color: "#1A1A2E", margin: "0 0 8px" }}>Link Not Found</h2>
        <p style={{ color: "#6B7280", fontSize: 14 }}>This signature link is invalid or has expired. Please contact your property manager for a new link.</p>
      </div>
    </div>
  );

  if (alreadySigned || step === "done") return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <CheckCircle2 size={52} color="#22C55E" style={{ margin: "0 auto 14px" }} />
          <h2 style={{ fontWeight: 800, fontSize: 22, color: "#1A1A2E", margin: "0 0 8px" }}>Document Signed</h2>
          <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7 }}>
            {alreadySigned
              ? `This document was already signed on ${doc.signed_at ? new Date(doc.signed_at).toLocaleDateString() : "a previous date"}.`
              : "Your signature has been recorded successfully."}
          </p>
        </div>
        <div style={{ background: "#F4F3FF", borderRadius: 12, padding: "16px", border: "1px solid rgba(124,111,205,0.12)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#7C6FCD", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Signature Record</p>
          <p style={{ fontSize: 13, color: "#1A1A2E", margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>{doc.tenant_signature}</p>
        </div>
      </div>
    </div>
  );

  if (step === "declined") return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <XCircle size={52} color="#EF4444" style={{ margin: "0 auto 14px" }} />
        <h2 style={{ fontWeight: 800, fontSize: 22, color: "#1A1A2E", margin: "0 0 8px" }}>Signature Declined</h2>
        <p style={{ color: "#6B7280", fontSize: 14 }}>You have declined to sign this document. Your property manager has been notified.</p>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#7C6FCD", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: "#1A1A2E" }}>iTenant</span>
        <span style={{ fontSize: 13, color: "#9CA3AF", marginLeft: 4 }}>E-Signature</span>
      </div>

      <div style={cardStyle}>
        {/* Document info */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(124,111,205,0.1)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,111,205,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={22} color="#7C6FCD" />
          </div>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: "#1A1A2E", margin: "0 0 4px" }}>{doc.file_name}</h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
              Requested for: <strong style={{ color: "#1A1A2E" }}>{doc.signer_name || "You"}</strong>
              {doc.signature_requested_at && ` · ${new Date(doc.signature_requested_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Review step */}
        {step === "review" && (
          <div>
            {doc.file_url && (
              <div style={{ marginBottom: 20 }}>
                <Label style={{ fontSize: 13, color: "#6B7280", display: "block", marginBottom: 8 }}>Document Preview</Label>
                {doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={doc.file_url} style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(124,111,205,0.15)" }} alt="Document" />
                ) : (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#F4F3FF", borderRadius: 10, border: "1px solid rgba(124,111,205,0.15)", color: "#7C6FCD", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
                  >
                    <FileText size={16} /> View / Download Document
                  </a>
                )}
              </div>
            )}

            {doc.body_text && (
              <div style={{ background: "#F4F3FF", borderRadius: 10, padding: "16px", marginBottom: 20, maxHeight: 260, overflowY: "auto", fontSize: 13, color: "#1A1A2E", lineHeight: 1.7, whiteSpace: "pre-wrap", border: "1px solid rgba(124,111,205,0.12)" }}>
                {doc.body_text}
              </div>
            )}

            <div style={{ background: "#FEF9C3", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#92400E" }}>
              ⚠️ Please review the document carefully before signing. By signing, you agree to be legally bound by its terms.
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep("sign")}
                style={{ flex: 1, background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none", padding: "11px", fontWeight: 700 }}
              >
                <PenLine size={15} style={{ marginRight: 6 }} /> I've Reviewed — Proceed to Sign
              </Button>
              <Button variant="outline" onClick={decline} disabled={submitting} style={{ borderRadius: 999, color: "#EF4444", borderColor: "#EF4444" }}>
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* Sign step */}
        {step === "sign" && (
          <div className="space-y-5">
            <div>
              <Label style={{ fontSize: 13 }}>Your Full Legal Name *</Label>
              <Input
                className="mt-1"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="As it appears on your ID"
              />
            </div>

            <div>
              <Label style={{ fontSize: 13 }}>Type Your Initials * <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(serves as your electronic signature)</span></Label>
              <Input
                className="mt-1"
                value={initials}
                onChange={e => setInitials(e.target.value)}
                placeholder="e.g. J.S."
                style={{ fontFamily: "Georgia, serif", fontSize: 24, height: 56, color: "#7C6FCD", fontWeight: 700 }}
                maxLength={10}
              />
              {initials && (
                <div style={{ marginTop: 10, padding: "14px 18px", background: "#F4F3FF", borderRadius: 10, border: "2px solid #7C6FCD" }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Signature Preview</p>
                  <p style={{ fontSize: 28, fontFamily: "Georgia, serif", color: "#7C6FCD", fontWeight: 700, margin: 0 }}>{initials}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 0" }}>{signerName} · {new Date().toLocaleString()}</p>
                </div>
              )}
            </div>

            <div style={{ background: "#F4F3FF", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
              By clicking "Sign Document", you agree that your typed initials constitute a legally binding electronic signature in accordance with applicable e-signature laws.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("review")} style={{ borderRadius: 999 }}>Back</Button>
              <Button
                onClick={sign}
                disabled={!signerName || !initials || submitting}
                style={{ flex: 1, background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none", fontWeight: 700 }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle2 size={14} style={{ marginRight: 6 }} />}
                {submitting ? "Signing…" : "Sign Document"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}