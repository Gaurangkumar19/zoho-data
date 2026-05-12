import type { Tables } from "@/integrations/supabase/types";

export type Deal = Tables<"deals">;

const KNOWN_KEYS: Record<string, string> = {
  account_name: "account_name",
  account: "account_name",
  "account name": "account_name",
  "account name.id": "account_name",
  client: "account_name",
  customer: "account_name",
  company: "account_name",
  "account name1": "account_name",

  deal_name: "deal_name",
  deal: "deal_name",
  "deal name": "deal_name",
  opportunity: "deal_name",

  stage: "stage",
  pipeline_stage: "stage",

  status: "status",

  amount: "amount",
  value: "amount",
  revenue: "amount",
  price: "amount",
  "total opportunity amount": "amount",

  currency: "currency",
  "currency  type": "currency",

  close_date: "close_date",
  "close date": "close_date",
  "closing date": "close_date",
  closed_at: "close_date",
  date: "close_date",

  owner: "owner",
  "deal owner": "owner",
  rep: "owner",
  salesperson: "owner",
};

function norm(k: string) {
  return k.trim().toLowerCase().replace(/\s+/g, " ");
}

export function rowToDeal(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined || v === "") continue;
    const target = KNOWN_KEYS[norm(k)];
    if (target) {
      mapped[target] = v;
    } else {
      extra[k] = v;
    }
  }
  if (!mapped.account_name) return null;

  let amount: number | null = null;
  if (mapped.amount != null) {
    const n = Number(String(mapped.amount).replace(/[^0-9.\-]/g, ""));
    amount = Number.isFinite(n) ? n : null;
  }

  let close_date: string | null = null;
  if (mapped.close_date) {
    const d = new Date(mapped.close_date as string);
    if (!isNaN(d.getTime())) close_date = d.toISOString().slice(0, 10);
  }

  const status = (mapped.status as string | undefined)?.toString() ?? null;

  return {
    account_name: String(mapped.account_name),
    deal_name: mapped.deal_name ? String(mapped.deal_name) : null,
    stage: mapped.stage ? String(mapped.stage) : null,
    status,
    amount,
    currency: mapped.currency ? String(mapped.currency) : null,
    close_date,
    owner: mapped.owner ? String(mapped.owner) : null,
    extra,
  };
}

export function classifyStatus(d: Pick<Deal, "status" | "stage">): "won" | "lost" | "open" {
  const s = `${d.status ?? ""} ${d.stage ?? ""}`.toLowerCase();
  if (/\bwon\b|closed[\s_-]*won|success/.test(s)) return "won";
  if (/\blost\b|closed[\s_-]*lost|fail/.test(s)) return "lost";
  return "open";
}

export function fmtCurrency(n: number | null | undefined, currency?: string | null) {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency || "$"} ${n.toLocaleString()}`;
  }
}
