export const fmtCurrency = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return "৳" + v.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function nextInvoiceNumber(existingCount: number, d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(existingCount + 1).padStart(4, "0");
  return `FNET-${y}-${m}-${seq}`;
}

export function nextCustomerCode(existingCount: number) {
  return "FNET-C-" + String(existingCount + 1).padStart(5, "0");
}
