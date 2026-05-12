import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, "src", "Opportunities_001.csv");
const csvBuffer = fs.readFileSync(csvPath);

// Parse CSV
const workbook = XLSX.read(csvBuffer, { type: "buffer" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

console.log(`Parsed ${rows.length} rows from CSV`);

// Initialize Supabase client
const supabaseUrl = "https://vkhqdwsdjcotbrzqkxvh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHFkd3NkamNvdGJyenFreHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODk2NDUsImV4cCI6MjA5NDA2NTY0NX0.VOV1KYwztswFjrCUkc_l1-wsIDbvY7qrf4TqLtVqGIA";

const supabase = createClient(supabaseUrl, supabaseKey);

// Map rows to deals (similar to rowToDeal)
function mapRowToDeal(row) {
  const extra = {};
  const mapped = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    const normKey = key.trim().toLowerCase().replace(/\s+/g, " ");
    let targetKey = null;

    if (
      normKey.includes("account name") ||
      normKey.includes("account_name") ||
      normKey === "account"
    ) {
      targetKey = "account_name";
    } else if (
      normKey.includes("deal name") ||
      normKey.includes("deal_name") ||
      normKey === "deal"
    ) {
      targetKey = "deal_name";
    } else if (normKey === "stage") {
      targetKey = "stage";
    } else if (normKey === "status") {
      targetKey = "status";
    } else if (
      normKey === "amount" ||
      normKey.includes("total opportunity amount")
    ) {
      targetKey = "amount";
    } else if (normKey === "currency" || normKey.includes("currency")) {
      targetKey = "currency";
    } else if (
      normKey.includes("closing date") ||
      normKey.includes("close date")
    ) {
      targetKey = "close_date";
    } else if (
      normKey.includes("owner") ||
      normKey.includes("created by") ||
      normKey.includes("modified by")
    ) {
      if (!mapped.owner) {
        targetKey = "owner";
      }
    } else {
      extra[key] = value;
    }

    if (targetKey) {
      mapped[targetKey] = value;
    }
  }

  if (!mapped.account_name) {
    if (row["Account Name1"]) {
      mapped.account_name = row["Account Name1"];
    } else if (extra["Account Name1"]) {
      mapped.account_name = extra["Account Name1"];
    }
  }

  if (!mapped.account_name) {
    return null;
  }

  let amount = null;
  if (mapped.amount != null) {
    const n = Number(String(mapped.amount).replace(/[^0-9.\-]/g, ""));
    amount = Number.isFinite(n) ? n : null;
  }

  let close_date = null;
  if (mapped.close_date) {
    const d = new Date(mapped.close_date);
    if (!isNaN(d.getTime())) {
      close_date = d.toISOString().slice(0, 10);
    }
  }

  const status = mapped.status ? String(mapped.status) : null;

  return {
    account_name: String(mapped.account_name),
    deal_name: mapped.deal_name ? String(mapped.deal_name) : null,
    stage: mapped.stage ? String(mapped.stage) : null,
    status,
    amount,
    currency: mapped.currency ? String(mapped.currency) : "INR",
    close_date,
    owner: mapped.owner ? String(mapped.owner) : null,
    extra,
  };
}

const deals = rows.map(mapRowToDeal).filter((d) => d !== null);

console.log(`Mapped ${deals.length} valid deals`);

// Insert deals into Supabase
const BATCH = 500;
let inserted = 0;

try {
  for (let i = 0; i < deals.length; i += BATCH) {
    const chunk = deals.slice(i, i + BATCH);
    console.log(`Inserting ${i + chunk.length} / ${deals.length}…`);
    const { error } = await supabase.from("deals").insert(chunk);
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    inserted += chunk.length;
  }

  console.log(`✅ Success! Imported ${inserted} deals!`);
} catch (e) {
  console.error("❌ Import failed:", e);
}
