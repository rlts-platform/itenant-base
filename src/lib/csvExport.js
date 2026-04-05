// CSV Export utility for iTenant
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "";
  return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return "";
  return `${Number(value).toFixed(1)}%`;
};

export const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const generateCSV = (headers, rows) => {
  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = rows.map(row => headers.map(h => escapeCSV(row[h] ?? "")).join(","));
  return [headerRow, ...dataRows].join("\n");
};

export const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const getDateForFilename = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};