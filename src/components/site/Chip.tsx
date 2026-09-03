import type { ReactNode } from "react";

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-foreground/25 text-foreground/80 hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function StatusChip({ children, tone }: { children: ReactNode; tone: string }) {
  const tones: Record<string, string> = {
    thread: "border-thread text-thread",
    ink: "border-primary text-primary",
    rust: "border-rust text-rust",
    muted: "border-foreground/25 text-muted-foreground",
  };
  return (
    <span className={`inline-block border px-2 py-0.5 text-xs ${tones[tone] ?? tones["muted"]}`}>
      {children}
    </span>
  );
}

export const statusTone = (status: string) =>
  status === "delivered" || status === "paid"
    ? "thread"
    : status === "cancelled" || status === "refunded"
      ? "rust"
      : status === "pending_payment"
        ? "muted"
        : "ink";
