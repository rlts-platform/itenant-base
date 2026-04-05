import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ChatPanel from "../components/assistant/ChatPanel";
import ResourceLibrary from "../components/assistant/ResourceLibrary";
import PropertyInsights from "../components/assistant/PropertyInsights";

export default function Assistant() {
  const { user } = useAuth();
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Property.list(),
      base44.entities.Unit.list(),
    ]).then(([props, units]) => {
      // Extract state hints from addresses (rough — just pass address list for AI context)
      const stateGuess = props[0]?.state || props[0]?.address?.split(",").slice(-1)[0]?.trim() || "unknown";
      setContext({
        state: stateGuess,
        properties: props.length,
        units: units.length,
      });
    });
  }, [user]);

  const [tab, setTab] = useState("chat");

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0" style={{ backgroundColor: '#fff' }}>
        {[{ id: "chat", label: "AI Chat" }, { id: "insights", label: "Portfolio Intelligence ✨" }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 22px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: "none", borderBottom: tab === t.id ? "2px solid #7C6FCD" : "2px solid transparent",
              color: tab === t.id ? "#7C6FCD" : "#6B7280",
              transition: "all 0.15s",
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === "chat" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Chat */}
          <div className="flex-1 flex flex-col border-r border-border min-w-0">
            <div className="flex-1 overflow-hidden">
              <ChatPanel context={context} />
            </div>
          </div>
          {/* Right — Resource Library */}
          <div className="w-96 shrink-0 flex flex-col overflow-hidden hidden lg:flex">
            <ResourceLibrary />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <PropertyInsights />
        </div>
      )}
    </div>
  );
}