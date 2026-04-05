import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_PROMPTS = [
  "What are the landlord-tenant laws for security deposits in my state?",
  "Help me write a late rent notice",
  "What maintenance should I do before winter?",
  "Find licensed vendors near my property",
  "How do I handle a tenant who refuses to leave after lease ends?",
];

export default function ChatPanel({ context }) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    initConversation();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    const existing = await base44.agents.listConversations({ agent_name: "property_assistant" });
    const mine = existing?.filter(c => c.metadata?.user_email === user?.email);
    let conv;
    if (mine?.length > 0) {
      conv = await base44.agents.getConversation(mine[0].id);
    } else {
      conv = await base44.agents.createConversation({
        agent_name: "property_assistant",
        metadata: { user_email: user?.email, name: "Property Assistant" }
      });
    }
    setConversation(conv);
    setMessages(conv.messages || []);

    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages([...(data.messages || [])]);
    });
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || sending) return;
    setSending(true);
    setInput("");

    const contextPrefix = context
      ? `[Context: State=${context.state || "unknown"}, Properties=${context.properties}, Units=${context.units}]\n\n`
      : "";

    const fullMessage = contextPrefix + text;

    await base44.agents.addMessage(conversation, {
      role: "user",
      content: fullMessage,
    });

    setSending(false);
  };

  const visibleMessages = messages.filter(m => m.role === "user" || m.role === "assistant");

  // Strip context prefix from display
  const displayContent = (content) =>
    content?.replace(/^\[Context:[^\]]*\]\n\n/, "") || "";

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">iTenant AI Assistant</h3>
              <p className="text-sm text-muted-foreground mt-1">Ask anything about property management</p>
            </div>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/40 transition-all text-sm"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {visibleMessages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser ? "bg-primary text-white rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"
                }`}>
                  {displayContent(m.content)}
                </div>
                {m.created_date && (
                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-card border border-border">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Ask anything about property management…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || !conversation}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending || !conversation}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}