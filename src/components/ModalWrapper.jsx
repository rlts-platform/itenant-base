import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal } from "@/components/ui/dialog";

export default function ModalWrapper({ open, onOpenChange, title, description, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Backdrop Overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 999,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        />
        {/* Modal Content Container */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            alignItems: "flex-start",
            paddingTop: "5vh",
            paddingBottom: "5vh",
            zIndex: 1000,
            pointerEvents: "none",
          }}
          >
          <div
            style={{
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "12px",
              background: "#fff",
              width: "90%",
              maxWidth: "500px",
              margin: "0 auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              pointerEvents: "auto",
            }}
          >
            {(title || description) && (
              <div style={{ padding: "20px", borderBottom: "1px solid rgba(124,111,205,0.12)" }}>
                {title && <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A2E", margin: 0 }}>{title}</h2>}
                {description && <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px", margin: description ? "4px 0 0" : 0 }}>{description}</p>}
              </div>
            )}
            <div style={{ padding: "20px" }}>
              {children}
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}