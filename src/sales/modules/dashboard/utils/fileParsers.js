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
// Lead Data can each arrive as .csv, .xlsx/.xls, or .pdf. All three return
// the same shape -- an array of header-keyed row objects -- so the rest of
// the comparison pipeline (dataComparison.js) never needs to know which
// format a file came in as.
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

const HEADER_HINTS = ["name", "address", "phone", "number", "email", "status", "comment", "salesperson", "source", "date", "stage"];

// Turns the raw cell-grid reconstructed from a PDF's text positions into
// header-keyed row objects, matching what parseCSVFile/parseExcelFile
// return. Finds the row that looks most like a real header row (rather
// than assuming row 0) since PDF exports of these sheets usually have a
// title row ("August 2026 Leads") above the actual column headers.
function rowsFromPdfCells(cellRows) {
  const headerIndex = cellRows.findIndex((cells) => {
    const joined = cells.join(" ").toLowerCase();
    return HEADER_HINTS.filter((hint) => joined.includes(hint)).length >= 3;
  });

  if (headerIndex === -1 || headerIndex === cellRows.length - 1) {
    // No recognizable header row -- fall back to generic column labels so
    // rows are still visible for manual review instead of silently dropped.
    return cellRows.map((cells) => {
      const obj = {};
      cells.forEach((c, i) => { obj[`Column ${i + 1}`] = c; });
      return obj;
    });
  }

  const headers = cellRows[headerIndex];
  return cellRows
    .slice(headerIndex + 1)
    .filter((cells) => cells.some((c) => c))
    .map((cells) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h || `Column ${i + 1}`] = cells[i] || ""; });
      return obj;
    });
}

// Best-effort table reconstruction from a PDF's text layer: clusters text
// items into visual rows by y-position, then into columns within each row
// by x-position gaps. This works reasonably well for grid-style exports
// like the master sheets salespeople send (see KD_TREE_ALBANY_AUG_2026.pdf)
// but is inherently less reliable than a CSV/XLSX export of the same
// sheet -- callers should treat PDF as the fallback format, not the
// primary one.
export async function parsePDFFile(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allCellRows = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ text: it.str.trim(), x: it.transform[4], y: it.transform[5] }));
    if (!items.length) continue;

    // Sort top-to-bottom, then left-to-right, and cluster into rows: items
    // within Y_TOLERANCE of each other are the same visual line.
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const Y_TOLERANCE = 4;
    const visualRows = [];
    let currentRow = [];
    let currentY = null;
    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) <= Y_TOLERANCE) {
        currentRow.push(item);
        currentY = currentY === null ? item.y : currentY;
      } else {
        visualRows.push(currentRow);
        currentRow = [item];
        currentY = item.y;
      }
    }
    if (currentRow.length) visualRows.push(currentRow);

    // Within a visual row, a horizontal gap wider than GAP_THRESHOLD marks
    // a new column; anything narrower is the same cell's wrapped words.
    const GAP_THRESHOLD = 12;
    for (const row of visualRows) {
      row.sort((a, b) => a.x - b.x);
      const cells = [];
      let cell = row[0].text;
      let lastX = row[0].x + row[0].text.length * 4.2;
      for (let i = 1; i < row.length; i++) {
        const item = row[i];
        if (item.x - lastX > GAP_THRESHOLD) {
          cells.push(cell.trim());
          cell = item.text;
        } else {
          cell += " " + item.text;
        }
        lastX = item.x + item.text.length * 4.2;
      }
      cells.push(cell.trim());
      allCellRows.push(cells);
    }
  }

  return rowsFromPdfCells(allCellRows);
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
    return { rows: await parsePDFFile(file), format: "pdf" };
  }
  throw new Error(`Unsupported file type: "${file.name}". Upload a .csv, .xlsx, or .pdf file.`);
}
