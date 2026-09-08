import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Same pdfjs worker wiring already used by
// smart-hire/modules/resume-ai/pages/UploadResume.jsx -- reusing it here
// rather than reconfiguring pdfjs a second way.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ─────────────────────────────────────────────────────────────────────────
// Multi-format reader for the Data Comparison tab: Master Data and GHL
// Lead Data can each arrive as .csv, .xlsx/.xls, or .pdf.
//
// CSV and Excel parse locally into header-keyed row objects -- both
// formats have real, unambiguous columns, so this is fast and reliable.
//
// PDF does NOT get parsed into columns locally anymore. An earlier version
// of this file reconstructed a table from the PDF's text-item positions
// (clustering by x/y coordinates), but that heuristic silently produced
// WRONG column alignment on real sheets whenever two nearby columns'
// spacing didn't match its assumptions -- worse than not parsing at all,
// because the bad data looked plausible. PDF now only extracts plain text
// here; turning that text into structured records is handled by Claude
// (see aiExtraction.js), which is far more reliable on messy, hand-typed
// sheets than a positional heuristic can be.
// ─────────────────────────────────────────────────────────────────────────

export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // defval: '' avoids `undefined` on blank cells; raw: false stringifies
  // dates/numbers the same consistent way CSV rows already arrive as.
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
}

// Plain-text extraction only -- same approach as
// UploadResume.jsx's extractPDFText. No column reconstruction; that's now
// Claude's job (aiExtraction.js) rather than a positional guess.
export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return fullText;
}

export async function parseDataFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return { rows: await parseCSVFile(file), format: "csv" };
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return { rows: await parseExcelFile(file), format: "excel" };
  }
  if (name.endsWith(".pdf")) {
    return { rawText: await extractPdfText(file), format: "pdf" };
  }
  throw new Error(`Unsupported file type: "${file.name}". Upload a .csv, .xlsx, or .pdf file.`);
}

// Reconstructs a plain-text table from already-parsed CSV/Excel rows, for
// sending to Claude when an admin hits "Fix with Claude" on a file whose
// columns parsed into the wrong place (e.g. an unquoted comma in an
// address shifted every column after it). Tab-separated so commas inside
// a cell's own text don't get confused with a delimiter again.
export function rowsToDelimitedText(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join("\t")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => String(row[h] ?? "").replace(/\t/g, " ")).join("\t"));
  });
  return lines.join("\n");
}
