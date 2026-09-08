import { useState } from "react";
import { parseDataFile } from "../utils/fileParsers";
import { runComparison } from "../utils/dataComparison";

// ─────────────────────────────────────────────────────────────────────────
// State + actions for the Data Comparison tab: parses the two uploaded
// files (Master Data, GHL Lead Data) with fileParsers.parseDataFile, runs
// dataComparison.runComparison between them, and holds the result for the
// tab to render. Entirely client-side and in-memory -- nothing here is
// persisted to Supabase, so re-opening the tab starts fresh. That matches
// how this is meant to be used (an ad-hoc audit pass over two files an
// admin has in hand), and avoids adding new tables/RLS surface for a
// feature that doesn't need a history of past comparisons to work.
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

  const loadFile = async (file, { setBusy, setFile, setRows, setFormat, label }) => {
    if (!file) return;
    setBusy(true);
    try {
      const { rows, format } = await parseDataFile(file);
      if (!rows.length) {
        notify?.(`"${file.name}" parsed but has no rows — check it isn't empty or password-protected.`, { type: "error" });
        return;
      }
      setFile(file);
      setRows(rows);
      setFormat(format);
      setResult(null); // stale comparison from a previous file no longer applies
      notify?.(`Loaded ${rows.length} row(s) from ${label} file "${file.name}".`);
    } catch (err) {
      console.error(`${label} file parse error:`, err);
      notify?.(err.message || `Could not read that ${label.toLowerCase()} file.`, { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleMasterFile = (file) =>
    loadFile(file, { setBusy: setParsingMaster, setFile: setMasterFile, setRows: setMasterRows, setFormat: setMasterFormat, label: "Master Data" });

  const handleGhlFile = (file) =>
    loadFile(file, { setBusy: setParsingGhl, setFile: setGhlFile, setRows: setGhlRows, setFormat: setGhlFormat, label: "GHL Data" });

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
