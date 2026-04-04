import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [m, t] = await Promise.all([base44.entities.Message.list("-created_date"), base44.entities.Tenant.list()]);
    setMessages(m); setTenants(t); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const thread = selected ? messages.filter(m => m.from_user === selected || m.to_user === selected) : [];
  const send = async () => {
    if (!body.trim() || !selected) return;
    await base44.entities.Message.create({ body, from_user: user?.email, to_user: selected, read: false });
    setBody(""); load();
  };

  const tenantName = (email) => { const t = tenants.find(t => t.email === email); return t ? `${t.first_name} ${t.last_name}` : email; };
  const conversations = [...new Set(messages.flatMap(m => [m.from_user, m.to_user]).filter(e => e !== user?.email))];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-outfit font-700 mb-6">Messages</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden flex h-[600px]">
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted-foreground font-medium">CONVERSATIONS</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No conversations</div>
            ) : conversations.map(email => (
              <button key={email} onClick={() => setSelected(email)}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${selected === email ? "bg-accent text-accent-foreground" : ""}`}>
                <div className="font-medium text-sm">{tenantName(email)}</div>
                <div className="text-xs text-muted-foreground truncate">{email}</div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">New conversation with:</div>
            <select className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-background" onChange={e => setSelected(e.target.value)} value={selected || ""}>
              <option value="">Select tenant</option>
              {tenants.map(t => <option key={t.id} value={t.email}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Select a conversation</p></div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border"><h3 className="font-semibold">{tenantName(selected)}</h3></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.slice().reverse().map(m => (
                  <div key={m.id} className={`flex ${m.from_user === user?.email ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${m.from_user === user?.email ? "bg-primary text-white" : "bg-secondary"}`}>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && send()} />
                <Button onClick={send} size="icon"><Send className="w-4 h-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}