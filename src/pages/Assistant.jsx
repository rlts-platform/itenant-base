import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ChatPanel from "../components/assistant/ChatPanel";
import ResourceLibrary from "../components/assistant/ResourceLibrary";

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

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left — Chat */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        <div className="px-5 py-3 border-b border-border shrink-0">
          <h1 className="font-outfit font-bold text-lg">AI Assistant</h1>
          <p className="text-xs text-muted-foreground">Your property management advisor</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel context={context} />
        </div>
      </div>

      {/* Right — Resource Library */}
      <div className="w-96 shrink-0 flex flex-col overflow-hidden hidden lg:flex">
        <ResourceLibrary />
      </div>
    </div>
  );
}