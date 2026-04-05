import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ConversationList({ conversations, tenants, messages, selected, onSelect, unreadCounts, properties, units }) {
  const [search, setSearch] = useState("");

  const tenantName = (email) => {
    const t = tenants.find(t => t.email === email);
    return t ? `${t.first_name} ${t.last_name}` : email;
  };

  const getLastMessage = (email) => {
    const msgs = messages.filter(m => m.from_user === email || m.to_user === email);
    return msgs[msgs.length - 1];
  };

  const getPropertyLabel = (msg) => {
    if (!msg?.property_id) return "General";
    const prop = properties.find(p => p.id === msg.property_id);
    const unit = units.find(u => u.id === msg.unit_id);
    return `${prop?.nickname || prop?.address.split(",")[0]} — Unit ${unit?.unit_number}`;
  };

  const filtered = useMemo(() => {
    if (!search) return conversations.sort((a, b) => {
      const msgA = getLastMessage(a);
      const msgB = getLastMessage(b);
      if (msgA?.urgent && !msgB?.urgent) return -1;
      if (!msgA?.urgent && msgB?.urgent) return 1;
      return new Date(msgB?.created_date || 0) - new Date(msgA?.created_date || 0);
    });

    const s = search.toLowerCase();
    return conversations.filter(email => {
      const name = tenantName(email).toLowerCase();
      const msgs = messages.filter(m => m.from_user === email || m.to_user === email);
      const lastMsg = msgs[msgs.length - 1];
      const propLabel = getPropertyLabel(lastMsg).toLowerCase();
      const msgContent = msgs.some(m => m.body?.toLowerCase().includes(s));
      return name.includes(s) || propLabel.includes(s) || msgContent;
    });
  }, [search, conversations, messages]);

  return (
    <div className="w-64 border-r border-border flex flex-col">
      <div className="p-3 border-b border-border space-y-2">
        <p className="text-xs text-muted-foreground font-medium">CONVERSATIONS</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input className="pl-7 h-8 text-xs" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No conversations</div>
        ) : filtered.map(email => {
          const lastMsg = getLastMessage(email);
          const unread = unreadCounts[email] || 0;
          return (
            <button
              key={email}
              onClick={() => onSelect(email)}
              className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0 ${selected === email ? "bg-accent text-accent-foreground" : ""}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{tenantName(email)}</p>
                    {unread > 0 && <span className="text-xs bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">{unread}</span>}
                  </div>
                  {lastMsg?.urgent && <p className="text-xs text-red-600 font-semibold">🚩 Urgent</p>}
                  <p className="text-xs text-muted-foreground truncate">{getPropertyLabel(lastMsg)}</p>
                  <p className="text-xs text-muted-foreground truncate">{lastMsg?.body?.slice(0, 30)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}