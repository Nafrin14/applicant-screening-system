import { useState } from "react";
import { parseDataFile, rowsToDelimitedText } from "../utils/fileParsers";
import { extractRecordsWithClaude } from "../utils/aiExtraction";
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
// CSV/Excel parse locally (fast, and reliable for well-formed files). PDF
// has no reliable local column parser -- see fileParsers.js -- so a PDF
// upload always goes through extractRecordsWithClaude (server-side Claude
// call). "Fix with Claude" lets the admin re-run any loaded file (any
// format) through the same AI path on demand, for the case a CSV/Excel's
// columns came out wrong locally (e.g. an unquoted comma in an address
// shifting everything after it).
// ─────────────────────────────────────────────────────────────────────────
export default function useDataComparison({ notify } = {}) {
  const [masterFile, setMasterFile] = useState(null);
  const [ghlFile, setGhlFile] = useState(null);
  const [masterRows, setMasterRows] = useState(null);
  const [ghlRows, setGhlRows] = useState(null);
  const [masterFormat, setMasterFormat] = useState(null);
  const [ghlFormat, setGhlFormat] = useState(null);
  const [masterRawText, setMasterRawText] = useState(null);
  const [ghlRawText, setGhlRawText] = useState(null);
  const [masterAiExtracted, setMasterAiExtracted] = useState(false);
  const [ghlAiExtracted, setGhlAiExtracted] = useState(false);
  const [parsingMaster, setParsingMaster] = useState(false);
  const [parsingGhl, setParsingGhl] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);

  const slots = {
    master: { setBusy: setParsingMaster, setFile: setMasterFile, setRows: setMasterRows, setFormat: setMasterFormat, setRawText: setMasterRawText, setAiExtracted: setMasterAiExtracted, file: masterFile, rows: masterRows, format: masterFormat, rawText: masterRawText, label: "Master Data" },
    ghl: { setBusy: setParsingGhl, setFile: setGhlFile, setRows: setGhlRows, setFormat: setGhlFormat, setRawText: setGhlRawText, setAiExtracted: setGhlAiExtracted, file: ghlFile, rows: ghlRows, format: ghlFormat, rawText: ghlRawText, label: "GHL Data" },
  };

  const aiExtractionErrorMessage = (err, label) => {
    if (err.code === "ANTHROPIC_NOT_CONFIGURED") {
      return `AI extraction isn't set up yet on the server (ANTHROPIC_API_KEY missing) — needed to read a ${label.toLowerCase()} PDF reliably. Add it to server/.env, or upload a CSV/Excel export instead.`;
    }
    return err.message || `Could not extract records from that ${label.toLowerCase()} file.`;
  };

  const loadFile = async (which, file) => {
    if (!file) return;
    const slot = slots[which];
    slot.setBusy(true);
    try {
      const parsed = await parseDataFile(file);

      if (parsed.format === "pdf") {
        // PDFs have no reliable local column parser -- always go through
        // Claude for these.
        try {
          const { records, truncated } = await extractRecordsWithClaude(parsed.rawText, file.name);
          if (!records.length) {
            notify?.(`Claude read "${file.name}" but found no lead rows in it.`, { type: "error" });
            return;
          }
          slot.setFile(file); slot.setRows(records); slot.setFormat("pdf");
          slot.setRawText(parsed.rawText); slot.setAiExtracted(true);
          setResult(null);
          if (truncated) notify?.(`"${file.name}" was long — only the first part was sent for extraction. Consider a CSV/Excel export for large sheets.`, { type: "error" });
          notify?.(`AI-extracted ${records.length} record(s) from ${slot.label} file "${file.name}".`);
        } catch (err) {
          console.error(`${slot.label} PDF extraction error:`, err);
          notify?.(aiExtractionErrorMessage(err, slot.label), { type: "error" });
        }
        return;
      }

      // CSV / Excel: parse locally.
      if (!parsed.rows.length) {
        notify?.(`"${file.name}" parsed but has no rows — check it isn't empty.`, { type: "error" });
        return;
      }
      slot.setFile(file); slot.setRows(parsed.rows); slot.setFormat(parsed.format);
      slot.setRawText(null); slot.setAiExtracted(false);
      setResult(null); // stale comparison from a previous file no longer applies
      notify?.(`Loaded ${parsed.rows.length} row(s) from ${slot.label} file "${file.name}".`);
    } catch (err) {
      console.error(`${slot.label} file parse error:`, err);
      notify?.(err.message || `Could not read that ${slot.label.toLowerCase()} file.`, { type: "error" });
    } finally {
      slot.setBusy(false);
    }
  };

  // Re-runs the currently loaded file (whatever format it is) through
  // Claude, replacing its rows with the AI-extracted version. For CSV/PDF
  // this resends the file's own raw text; for Excel (no single "raw text"
  // form) it reconstructs a tab-separated table from the already-parsed
  // rows, since Claude only needs to see the data, not the original bytes.
  const fixWithClaude = async (which) => {
    const slot = slots[which];
    if (!slot.file || !slot.rows) return;
    slot.setBusy(true);
    try {
      const text = slot.format === "excel" ? rowsToDelimitedText(slot.rows) : (slot.rawText ?? await slot.file.text());
      const { records, truncated } = await extractRecordsWithClaude(text, slot.file.name);
      if (!records.length) {
        notify?.(`Claude re-read "${slot.file.name}" but found no lead rows in it.`, { type: "error" });
        return;
      }
      slot.setRows(records); slot.setAiExtracted(true);
      setResult(null);
      if (truncated) notify?.(`"${slot.file.name}" was long — only the first part was sent.`, { type: "error" });
      notify?.(`Re-extracted ${records.length} record(s) for ${slot.label} with Claude.`);
    } catch (err) {
      console.error(`${slot.label} fix-with-Claude error:`, err);
      notify?.(aiExtractionErrorMessage(err, slot.label), { type: "error" });
    } finally {
      slot.setBusy(false);
    }
  };

  const handleMasterFile = (file) => loadFile("master", file);
  const handleGhlFile = (file) => loadFile("ghl", file);
  const fixMasterWithClaude = () => fixWithClaude("master");
  const fixGhlWithClaude = () => fixWithClaude("ghl");

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
    setMasterRawText(null); setGhlRawText(null);
    setMasterAiExtracted(false); setGhlAiExtracted(false);
    setResult(null);
  };

  return {
    masterFile, ghlFile, masterRows, ghlRows, masterFormat, ghlFormat,
    masterAiExtracted, ghlAiExtracted,
    parsingMaster, parsingGhl, comparing, result,
    handleMasterFile, handleGhlFile, fixMasterWithClaude, fixGhlWithClaude, runCompare, reset,
  };
}
