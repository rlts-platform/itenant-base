import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TenantAnnouncements from "../components/tenant/TenantAnnouncements";

export default function TenantMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState("announcements"); // announcements or messages
  const bottomRef = useRef(null);

  const load = async () => {
    const tenants = await base44.entities.Tenant.filter({ email: user?.email });
    const t = tenants[0];
    setTenant(t);
    if (t) {
      const accounts = await base44.entities.Account.filter({ id: t.account_id });
      setAccount(accounts[0]);
    }
    const sent = await base44.entities.Message.filter({ from_user: user?.email });
    const received = await base44.entities.Message.filter({ to_user: user?.email });
    const all = [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(all);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { load(); }, [user]);

  const send = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    // For tenants, we send to "landlord" — get client from tenant record
    const tenants = await base44.entities.Tenant.filter({ email: user?.email });
    const tenant = tenants[0];
    const toUser = tenant?.account_id || "landlord";

    await base44.entities.Message.create({
      body: newMsg.trim(),
      from_user: user?.email,
      to_user: toUser,
      read: false,
    });
    setNewMsg("");
    setSending(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-outfit font-700">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Communicate with your property manager</p>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "announcements" ? "bg-white shadow" : "hover:bg-white/50"
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "messages" ? "bg-white shadow" : "hover:bg-white/50"
          }`}
        >
          Direct Messages
        </button>
      </div>

      {activeTab === "announcements" && (
        <div className="bg-card border border-border rounded-xl p-4">
          <TenantAnnouncements tenant={tenant} account={account} />
        </div>
      )}

      {activeTab === "messages" && (
      <div className="bg-card border border-border rounded-xl flex flex-col" style={{ height: "60vh" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-semibold">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">Send a message to your landlord</p>
            </div>
          ) : (
            messages.map(m => {
              const isMe = m.from_user === user?.email;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white" : "bg-secondary text-foreground"}`}>
                    <p>{m.body}</p>
                    <p className={`text-xs mt-1 ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl"
          />
          <Button onClick={send} disabled={sending || !newMsg.trim()} size="icon" className="rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}