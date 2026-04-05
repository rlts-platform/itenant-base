import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Megaphone } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import PropertySelector from "../components/messages/PropertySelector";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import MessageInput from "../components/messages/MessageInput";
import BroadcastComposer from "../components/messages/BroadcastComposer";
import BroadcastInbox from "../components/messages/BroadcastInbox";

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedProp, setSelectedProp] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propSelectorOpen, setPropSelectorOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [account, setAccount] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [broadcastComposerOpen, setBroadcastComposerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations"); // conversations or broadcasts

  const load = async () => {
    const [m, t, p, u, a, b] = await Promise.all([
      base44.entities.Message.list("-created_date"),
      base44.entities.Tenant.list(),
      base44.entities.Property.list(),
      base44.entities.Unit.list(),
      base44.entities.Account.filter({ owner_email: user?.email }),
      base44.entities.Broadcast.list("-created_date"),
    ]);
    setMessages(m);
    setTenants(t);
    setProperties(p);
    setUnits(u);
    setAccount(a[0] || null);
    setBroadcasts(b || []);
    
    // Calculate unread counts
    const counts = {};
    m.forEach(msg => {
      if (msg.to_user === user?.email && !msg.read) {
        counts[msg.from_user] = (counts[msg.from_user] || 0) + 1;
      }
    });
    setUnreadCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => {
    if (!selected) {
      setSelectedProp(null);
      setSelectedUnit(null);
    }
  }, [selected]);

  const send = async (data) => {
    if (!selected || !selectedProp || !selectedUnit) return;
    await base44.entities.Message.create({
      body: data.body,
      from_user: user?.email,
      to_user: selected,
      property_id: selectedProp,
      unit_id: selectedUnit,
      attachments: data.attachments || [],
      urgent: data.urgent || false,
      read: false,
    });
    load();
  };

  const conversations = [...new Set(messages.flatMap(m => [m.from_user, m.to_user]).filter(e => e !== user?.email))];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-outfit font-700">Messages</h1>
        <Button onClick={() => setBroadcastComposerOpen(true)} className="gap-2"><Megaphone className="w-4 h-4" />New Broadcast</Button>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("conversations")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "conversations" ? "bg-white shadow" : "hover:bg-white/50"
          }`}
        >
          Conversations
        </button>
        <button
          onClick={() => setActiveTab("broadcasts")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "broadcasts" ? "bg-white shadow" : "hover:bg-white/50"
          }`}
        >
          Broadcasts
        </button>
      </div>

      {activeTab === "conversations" && (
      <div className="bg-card border border-border rounded-xl overflow-hidden flex h-[600px]">
        <ConversationList
          conversations={conversations}
          tenants={tenants}
          messages={messages}
          selected={selected}
          onSelect={setSelected}
          unreadCounts={unreadCounts}
          properties={properties}
          units={units}
        />

        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Select a conversation</p></div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{tenants.find(t => t.email === selected)?.first_name} {tenants.find(t => t.email === selected)?.last_name}</h3>
                  {selectedProp && selectedUnit && (
                    <p className="text-xs text-muted-foreground">📍 {properties.find(p => p.id === selectedProp)?.nickname || properties.find(p => p.id === selectedProp)?.address} — Unit {units.find(u => u.id === selectedUnit)?.unit_number}</p>
                  )}
                </div>
                {!selectedProp && <button onClick={() => setPropSelectorOpen(true)} className="text-primary text-xs underline">Link property</button>}
              </div>
              {selectedProp && selectedUnit ? (
                <>
                  <MessageThread messages={messages} selectedRecipient={selected} properties={properties} units={units} />
                  <MessageInput onSend={send} propertyId={selectedProp} unitId={selectedUnit} selectedRecipient={selected} />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  <button onClick={() => setPropSelectorOpen(true)} className="text-primary underline">Link a property & unit to start messaging</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <PropertySelector open={propSelectorOpen} onClose={() => setPropSelectorOpen(false)} onSelect={(prop, unit) => { setSelectedProp(prop); setSelectedUnit(unit); }} />
      )}

      {activeTab === "broadcasts" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <BroadcastInbox broadcasts={broadcasts} tenants={tenants} />
        </div>
      )}

      <BroadcastComposer
        open={broadcastComposerOpen}
        onClose={() => setBroadcastComposerOpen(false)}
        tenants={tenants}
        properties={properties}
        account={account}
        onSent={() => { setBroadcastComposerOpen(false); load(); }}
      />
    </div>
  );
}