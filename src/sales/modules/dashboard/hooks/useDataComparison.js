import { useState } from "react";
import { parseDataFile } from "../utils/fileParsers";
import { runComparison } from "../utils/dataComparison";

// ─────────────────────────────────────────────────────────────────────────
// State + actions for the Data Comparison tab: parses the two uploaded
// files (Master Data, GHL Lead Data) and runs dataComparison.runComparison
// between them. Entirely client-side and in-memory -- nothing here is
// persisted to Supabase, so re-opening the tab starts fresh. That matches
// how this is meant to be used (an ad-hoc audit pass over two files an
// admin has in hand), and avoids adding new tables/RLS surface for a
// feature that doesn't need a history of past comparisons to work.
//
// CSV/Excel/PDF all parse locally (see fileParsers.js -- PDF uses
// content-based field extraction: phone/email/date/status/source via
// regex and vocabulary matching, name/address/comment/salesperson as
// best-effort from what's left over).
// ─────────────────────────────────────────────────────────────────────────
export default function useDataComparison({ notify } = {}) {
  const [masterFile, setMasterFile] = useState(null);
  const [ghlFile, setGhlFile] = useState(null);
  const [masterRows, setMasterRows] = useState(null);
  const [ghlRows, setGhlRows] = useState(null);
  const [masterFormat, setMasterFormat] = useState(null);
  const [ghlFormat, setGhlFormat] = useState(null);
  const [parsingMaster, setParsingMaster] = useState(false);
  const [parsingGhl, setParsingGhl] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);

  const slots = {
    master: { setBusy: setParsingMaster, setFile: setMasterFile, setRows: setMasterRows, setFormat: setMasterFormat, label: "Master Data" },
    ghl: { setBusy: setParsingGhl, setFile: setGhlFile, setRows: setGhlRows, setFormat: setGhlFormat, label: "GHL Data" },
  };

  const loadFile = async (which, file) => {
    if (!file) return;
    const slot = slots[which];
    slot.setBusy(true);
    try {
      const parsed = await parseDataFile(file);

      if (!parsed.rows.length) {
        const hint = parsed.format === "pdf"
          ? ` Couldn't read any lead rows out of it -- try exporting a CSV/Excel instead.`
          : "";
        notify?.(`"${file.name}" parsed but has no rows -- check it isn't empty.${hint}`, { type: "error" });
        return;
      }
      slot.setFile(file); slot.setRows(parsed.rows); slot.setFormat(parsed.format);
      setResult(null); // stale comparison from a previous file no longer applies
      const note = parsed.format === "pdf" ? ` (read from the PDF's text)` : "";
      notify?.(`Loaded ${parsed.rows.length} row(s) from ${slot.label} file "${file.name}".${note}`);
    } catch (err) {
      console.error(`${slot.label} file parse error:`, err);
      notify?.(err.message || `Could not read that ${slot.label.toLowerCase()} file.`, { type: "error" });
    } finally {
      slot.setBusy(false);
    }
  };

  const handleMasterFile = (file) => loadFile("master", file);
  const handleGhlFile = (file) => loadFile("ghl", file);

  const runCompare = () => {
    if (!masterRows?.length || !ghlRows?.length) {
      notify?.("Upload both a Master Data file and a GHL Data file first.", { type: "error" });
      return;
    }
    setComparing(true);
    // Deferred a tick so the "Comparing…" state actually paints before the
    // (synchronous, CPU-bound) matching pass runs.
    setTimeout(() => {
      try {
        setResult(runComparison(masterRows, ghlRows));
      } catch (err) {
        console.error("Comparison error:", err);
        notify?.("Could not compare those files — check they both have readable column headers.", { type: "error" });
      } finally {
        setComparing(false);
      }
    }, 30);
  };

  const reset = () => {
    setMasterFile(null); setGhlFile(null);
    setMasterRows(null); setGhlRows(null);
    setMasterFormat(null); setGhlFormat(null);
    setResult(null);
  };

  return {
    masterFile, ghlFile, masterRows, ghlRows, masterFormat, ghlFormat,
    parsingMaster, parsingGhl, comparing, result,
    handleMasterFile, handleGhlFile, runCompare, reset,
  };
}
