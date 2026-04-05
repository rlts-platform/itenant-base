import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const URGENCY_COLORS = {
  emergency: "bg-red-500",
  urgent: "bg-orange-500",
  normal: "bg-blue-500",
};

export default function CalendarView({ orders, onSelectOrder, onDateSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Get orders for a specific date
  const getOrdersForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return orders.filter(o => o.scheduled_date?.startsWith(dateStr));
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const today = () => setCurrentDate(new Date());

  const days = Array.from({ length: firstDay }).map(() => null);
  days.push(...Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{monthName}</h2>
          <p className="text-xs text-muted-foreground">Click on work orders to view details</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={today} className="text-xs">Today</Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-xs font-semibold py-2">{d}</div>
        ))}
        {days.map((day, i) => (
          <div
            key={i}
            onClick={() => day && onDateSelect && onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
            className={`min-h-24 p-1 border rounded-lg ${day ? "bg-card border-border hover:bg-secondary/50 cursor-pointer" : "bg-gray-50"}`}
          >
            {day && (
              <>
                <p className="text-xs font-semibold text-muted-foreground">{day}</p>
                <div className="space-y-0.5 mt-1">
                  {getOrdersForDate(day).map(o => (
                    <button
                      key={o.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(o);
                      }}
                      className={`w-full text-left px-1.5 py-1 rounded text-xs font-medium text-white truncate ${URGENCY_COLORS[o.urgency] || URGENCY_COLORS.normal}`}
                      title={o.summary}
                    >
                      {o.summary}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs pt-2 border-t border-border">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500" /><span>Emergency</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-orange-500" /><span>Urgent</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500" /><span>Normal</span></div>
      </div>
    </div>
  );
}