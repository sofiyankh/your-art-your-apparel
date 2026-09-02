export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const SIZES = ["XS", "S", "M", "L", "XL", "2XL"] as const;
export type Size = (typeof SIZES)[number];

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Forward-only lifecycle, with the cancelled/refunded branch always available. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["in_production", "cancelled", "refunded"],
  in_production: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const COLOR_NAMES: Record<string, string> = {
  "#F2EFE7": "Natural canvas",
  "#211E19": "Ink black",
  "#22314F": "Deep indigo",
  "#A8461F": "Rust",
  "#5C6B3C": "Thread green",
};

export const colorName = (hex: string) => COLOR_NAMES[hex.toUpperCase()] ?? hex;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
