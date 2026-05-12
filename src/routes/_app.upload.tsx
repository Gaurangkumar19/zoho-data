import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { rowToDeal } from "@/lib/deals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload as UploadIcon, FileSpreadsheet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/upload")({
  component: UploadPage,
  head: () => ({ meta: [{ title: "Upload — ZOHO DATA" }] }),
});

function UploadPage() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const qc = useQueryClient();

  async function handleFile(file: File) {
    setBusy(true);
    setProgress("Reading file…");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

      const deals = rows.map(rowToDeal).filter((d): d is NonNullable<ReturnType<typeof rowToDeal>> => d !== null);

      if (deals.length === 0) {
        toast.error("No valid rows found. Make sure your sheet has an 'Account Name' column.");
        return;
      }

      // batched insert
      const BATCH = 500;
      let inserted = 0;
      for (let i = 0; i < deals.length; i += BATCH) {
        const chunk = deals.slice(i, i + BATCH);
        setProgress(`Uploading ${i + chunk.length} / ${deals.length}…`);
        const { error } = await supabase.from("deals").insert(chunk as never);
        if (error) throw error;
        inserted += chunk.length;
      }

      toast.success(`Imported ${inserted} deals`);
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function clearAll() {
    if (!confirm("Delete ALL deals? This cannot be undone.")) return;
    const { error } = await supabase.from("deals").delete().not("id", "is", null);
    if (error) toast.error(error.message);
    else {
      toast.success("All deals cleared");
      qc.invalidateQueries();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-teal-glow">Upload Excel</h1>
        <p className="text-sm text-cyan-200/70 mt-1">
          Import deals from .xlsx or .csv. Recognized columns: Account Name, Deal Name, Stage,
          Status, Amount, Currency, Close Date, Owner. Other columns are stored automatically.
        </p>
      </div>

      <Card className="p-8 glass-card">
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/30 rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/5 ${
            busy ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <FileSpreadsheet className="h-12 w-12 text-cyan-400 mb-3" />
          <p className="font-medium text-cyan-100">Click to choose an Excel file</p>
          <p className="text-xs text-cyan-200/60 mt-1">.xlsx, .xls, or .csv</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {progress && (
            <p className="text-sm text-teal-glow mt-4 flex items-center gap-2">
              <UploadIcon className="h-4 w-4 animate-pulse" />
              {progress}
            </p>
          )}
        </label>
      </Card>

      <Card className="p-5 glass-card flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-cyan-100">Danger zone</p>
          <p className="text-xs text-cyan-200/60">Remove every deal currently stored.</p>
        </div>
        <Button variant="destructive" onClick={clearAll} disabled={busy}>
          Clear all deals
        </Button>
      </Card>
    </div>
  );
}
