import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import PropertySelector from "../components/messages/PropertySelector";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import MessageInput from "../components/messages/MessageInput";

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

  const load = async () => {
    const [m, t, p, u] = await Promise.all([
      base44.entities.Message.list("-created_date"),
      base44.entities.Tenant.list(),
      base44.entities.Property.list(),
      base44.entities.Unit.list(),
    ]);
    setMessages(m);
    setTenants(t);
    setProperties(p);
    setUnits(u);
    
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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-outfit font-700 mb-6">Messages</h1>
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
    </div>
  );
}