export default function DateRangeFilter({ selected, onChange }) {
  const options = [
    { value: "30days", label: "Last 30 days" },
    { value: "3months", label: "Last 3 months" },
    { value: "6months", label: "Last 6 months" },
    { value: "1year", label: "This year" },
    { value: "alltime", label: "All time" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: selected === opt.value ? "2px solid #7C6FCD" : "1px solid rgba(124,111,205,0.3)",
            background: selected === opt.value ? "rgba(124,111,205,0.1)" : "#fff",
            color: selected === opt.value ? "#7C6FCD" : "#6B7280",
            fontWeight: selected === opt.value ? 600 : 500,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function getDateRange(selected) {
  const now = new Date();
  const endDate = now;
  let startDate;

  switch (selected) {
    case "30days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case "6months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case "1year":
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date("2000-01-01");
  }

  return { startDate: startDate.toISOString().split("T")[0], endDate: endDate.toISOString().split("T")[0] };
}