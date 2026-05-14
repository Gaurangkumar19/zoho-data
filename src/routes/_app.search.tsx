import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyStatus, fmtCurrency, type Deal } from "@/lib/deals";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search as SearchIcon } from "lucide-react";
import { StatusBadge } from "./_app.inventory";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/_app/search")({
  component: SearchPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — ZOHO DATA" }] }),
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [input, setInput] = useState(initialQ ?? "");
  const [active, setActive] = useState(initialQ ?? "");

  useEffect(() => {
    if (initialQ && initialQ !== active) setActive(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      let allData: { account_name: string }[] = [];
      let from = 0;
      const limit = 1000;
      
      try {
        while (true) {
          const { data, error } = await supabase
            .from("deals")
            .select("account_name")
            .range(from, from + limit - 1);
          if (error) {
            console.warn("Supabase query limit reached for accounts, stopping at", allData.length);
            break;
          }
          if (!data || data.length === 0) break;
          allData = [...allData, ...data];
          if (data.length < limit) break;
          from += limit;
        }
      } catch (e) {
        console.warn("Error fetching accounts:", e);
      }
      return [...new Set(allData.map((d) => d.account_name))].sort();
    },
  });

  const { data: deals = [], isLoading, isFetching } = useQuery({
    queryKey: ["search", active],
    enabled: !!active,
    queryFn: async () => {
      let allData: Deal[] = [];
      let from = 0;
      const limit = 1000;
      
      try {
        while (true) {
          const { data, error } = await supabase
            .from("deals")
            .select("*")
            .or(`account_name.ilike.%${active}%,deal_name.ilike.%${active}%`)
            .order("close_date", { ascending: false, nullsFirst: false })
            .range(from, from + limit - 1);
          if (error) {
            console.warn("Supabase query limit reached for search, stopping at", allData.length);
            break;
          }
          if (!data || data.length === 0) break;
          allData = [...allData, ...data];
          if (data.length < limit) break;
          from += limit;
        }
      } catch (e) {
        console.warn("Error fetching search results:", e);
      }
      return allData;
    },
  });

  const suggestions = useMemo(() => {
    const t = input.trim().toLowerCase();
    if (!t || t === active.toLowerCase()) return [];
    return accounts.filter((a) => a.toLowerCase().includes(t)).slice(0, 6);
  }, [input, accounts, active]);

  function runSearch(term: string) {
    const t = term.trim();
    setInput(t);
    setActive(t);
    navigate({ search: { q: t || undefined } });
  }

  const summary = useMemo(() => {
    const won = deals.filter((d) => classifyStatus(d) === "won");
    const lost = deals.filter((d) => classifyStatus(d) === "lost");
    return { count: deals.length, won: won.length, lost: lost.length };
  }, [deals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-teal-glow">Search Deals</h1>
        <p className="text-cyan-200/70 mt-1">
          Type an account or deal name and press Enter to view all related deals.
        </p>
      </div>

      <Card className="p-4 glass-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(input);
          }}
          className="flex gap-2 relative"
        >
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300" />
            <Input
              autoFocus
              placeholder="Account or deal name…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-200/40"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900/95 border border-cyan-500/30 rounded-md shadow-lg z-10 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => runSearch(s)}
                    className="block w-full text-left px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600">Search</Button>
        </form>
      </Card>

      {active && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card-3d rounded-xl p-4">
              <p className="text-xs text-cyan-200/70 uppercase tracking-wide">Deals</p>
              <p className="text-2xl font-bold mt-1 text-teal-glow">{summary.count}</p>
            </div>
            <div className="stat-card-3d rounded-xl p-4">
              <p className="text-xs text-cyan-200/70 uppercase tracking-wide">Won</p>
              <p className="text-2xl font-bold mt-1 text-teal-glow">{summary.won}</p>
            </div>
            <div className="stat-card-3d rounded-xl p-4">
              <p className="text-xs text-cyan-200/70 uppercase tracking-wide">Lost</p>
              <p className="text-2xl font-bold mt-1 text-rose-400">{summary.lost}</p>
            </div>
          </div>

          <Card className="overflow-hidden glass-card">
            <div className="px-5 py-3 border-b border-cyan-500/20 bg-slate-900/30">
              <p className="text-sm font-medium text-cyan-100">
                Results for <span className="text-teal-glow">"{active}"</span>
                {(isLoading || isFetching) && (
                  <span className="text-cyan-200/60 ml-2">loading…</span>
                )}
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-900/20">
                  <TableRow className="border-cyan-500/20">
                    <TableHead className="text-cyan-200">Account</TableHead>
                    <TableHead className="text-cyan-200">Deal</TableHead>
                    <TableHead className="text-cyan-200">Stage</TableHead>
                    <TableHead className="text-cyan-200">Status</TableHead>
                    <TableHead className="text-cyan-200 text-right">Amount</TableHead>
                    <TableHead className="text-cyan-200">Close Date</TableHead>
                    <TableHead className="text-cyan-200">Owner</TableHead>
                    <TableHead className="text-cyan-200">More</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-cyan-200/70 py-10">
                        No deals found for this account.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deals.map((d) => (
                      <TableRow key={d.id} className="border-cyan-500/10 hover:bg-cyan-500/10">
                        <TableCell className="font-medium text-cyan-100">{d.account_name}</TableCell>
                        <TableCell className="text-cyan-100">{d.deal_name ?? "—"}</TableCell>
                        <TableCell className="text-cyan-200/70">{d.stage ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={classifyStatus(d)} raw={d.status ?? d.stage} /></TableCell>
                        <TableCell className="text-right font-medium text-cyan-100">{fmtCurrency(d.amount, d.currency)}</TableCell>
                        <TableCell className="text-cyan-200/70">{d.close_date ?? "—"}</TableCell>
                        <TableCell className="text-cyan-200/70">{d.owner ?? "—"}</TableCell>
                        <TableCell>
                          <ExtraDetails extra={d.extra as Record<string, unknown>} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ExtraDetails({ extra }: { extra: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(extra ?? {});
  if (entries.length === 0) return <span className="text-cyan-200/60 text-xs">—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-teal-glow hover:underline"
      >
        {open ? "Hide" : `+${entries.length} fields`}
      </button>
      {open && (
        <div className="mt-2 max-w-xs space-y-1 text-xs">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-cyan-200/60">{k}:</span>
              <span className="font-medium text-cyan-100 break-words">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
