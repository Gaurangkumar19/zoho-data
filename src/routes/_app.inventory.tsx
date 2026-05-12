import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyStatus, fmtCurrency, type Deal } from "@/lib/deals";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({
  component: InventoryPage,
  head: () => ({ meta: [{ title: "Inventory — ZOHO DATA" }] }),
});

function InventoryPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      let allData: Deal[] = [];
      let from = 0;
      const limit = 1000;
      
      try {
        while (true) {
          const { data, error } = await supabase
            .from("deals")
            .select("*")
            .order("created_at", { ascending: false })
            .range(from, from + limit - 1);
          if (error) {
            console.warn("Supabase query limit reached, stopping at", allData.length);
            break;
          }
          if (!data || data.length === 0) break;
          allData = [...allData, ...data];
          if (data.length < limit) break;
          from += limit;
        }
      } catch (e) {
        console.warn("Error fetching all deals:", e);
      }
      return allData;
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return deals.filter((d) => {
      if (status !== "all" && classifyStatus(d) !== status) return false;
      if (!term) return true;
      return (
        d.account_name.toLowerCase().includes(term) ||
        (d.deal_name ?? "").toLowerCase().includes(term) ||
        (d.owner ?? "").toLowerCase().includes(term)
      );
    });
  }, [deals, q, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-teal-glow">Inventory</h1>
        <p className="text-cyan-200/70 mt-1">
          {deals.length.toLocaleString()} deals total · showing {filtered.length.toLocaleString()}
        </p>
      </div>

      <Card className="p-4 glass-card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300" />
            <Input
              placeholder="Search account, deal, or owner…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-200/40"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-48 bg-slate-900/50 border-cyan-500/30 text-cyan-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-cyan-500/30">
              <SelectItem value="all" className="text-cyan-100">All statuses</SelectItem>
              <SelectItem value="won" className="text-cyan-100">Won</SelectItem>
              <SelectItem value="lost" className="text-cyan-100">Lost</SelectItem>
              <SelectItem value="open" className="text-cyan-100">Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden glass-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/30">
              <TableRow className="border-cyan-500/20">
                <TableHead className="text-cyan-200">Account</TableHead>
                <TableHead className="text-cyan-200">Deal</TableHead>
                <TableHead className="text-cyan-200">Stage</TableHead>
                <TableHead className="text-cyan-200">Status</TableHead>
                <TableHead className="text-cyan-200 text-right">Amount</TableHead>
                <TableHead className="text-cyan-200">Close Date</TableHead>
                <TableHead className="text-cyan-200">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-cyan-200/70 py-10">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-cyan-200/70 py-10">No deals found.</TableCell></TableRow>
              ) : (
                filtered.slice(0, 500).map((d) => {
                  const s = classifyStatus(d);
                  return (
                    <TableRow key={d.id} className="border-cyan-500/10 hover:bg-cyan-500/10">
                      <TableCell>
                        <Link
                          to="/search"
                          search={{ q: d.account_name }}
                          className="font-medium text-teal-glow hover:text-cyan-200"
                        >
                          {d.account_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-cyan-100">{d.deal_name ?? "—"}</TableCell>
                      <TableCell className="text-cyan-200/70">{d.stage ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={s} raw={d.status ?? d.stage} />
                      </TableCell>
                      <TableCell className="text-right font-medium text-cyan-100">{fmtCurrency(d.amount, d.currency)}</TableCell>
                      <TableCell className="text-cyan-200/70">{d.close_date ?? "—"}</TableCell>
                      <TableCell className="text-cyan-200/70">{d.owner ?? "—"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 500 && (
          <div className="p-3 text-xs text-center text-cyan-200/60 border-t border-cyan-500/20">
            Showing first 500 results — refine your search to narrow down.
          </div>
        )}
      </Card>
    </div>
  );
}

export function StatusBadge({ status, raw }: { status: "won" | "lost" | "open"; raw?: string | null }) {
  const cls =
    status === "won"
      ? "bg-cyan-500/20 text-teal-glow border-cyan-500/40"
      : status === "lost"
      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
      : "bg-blue-500/20 text-cyan-200 border-blue-500/40";
  return <Badge variant="outline" className={cls}>{raw || status}</Badge>;
}
