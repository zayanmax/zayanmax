export function formatNumber(value?: number) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function formatCurrency(value?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
