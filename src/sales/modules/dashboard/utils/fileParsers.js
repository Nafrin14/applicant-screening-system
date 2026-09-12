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
// PDF also parses locally now, WITHOUT reconstructing a table from text
// x/y positions. An earlier version of this file clustered PDF text items
// into columns by x-coordinate, but that heuristic silently produced
// WRONG column alignment whenever a row had a different number of visible
// "columns" than its neighbors (a missing salesperson, a long wrapped
// comment, etc.) -- worse than not parsing at all, because the bad data
// looked plausible (address/phone landing under "Name", status landing
// under "Address").
//
// The fix: only use Y position to group text into rows (reliable -- a row
// of text is always at roughly the same height, regardless of how many
// "columns" it has), then read each row's FIELDS by their CONTENT --
// phone/date/email regexes and status/source vocabulary matching -- not
// by which x-position they happened to land at. That sidesteps the whole
// class of bug the old approach had. See parseLeadLine() below. Name,
// address, comment, and salesperson are inferred from what's left over
// after the reliable fields are pulled out, so those four are
// best-effort on an unusually phrased row -- worth a glance on anything
// that looks off, but no longer dependent on any external API.
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

// ─── PDF: row extraction by Y position only ───────────────────────────────
// Groups text items into lines using vertical position alone (no column
// guessing). Words within a line are then ordered left-to-right so the
// line reads naturally, but nothing here decides "this word belongs to
// the Address column" -- that decision is made later, from content, in
// parseLeadLine().
export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines = [];
  const Y_TOLERANCE = 4;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ text: it.str, x: it.transform[4], y: it.transform[5] }));
    if (!items.length) continue;

    // Top-to-bottom, then left-to-right within a row.
    items.sort((a, b) => b.y - a.y || a.x - b.x);

    let currentRow = [];
    let currentY = null;
    const flushRow = () => {
      if (!currentRow.length) return;
      lines.push(
        currentRow
          .sort((a, b) => a.x - b.x)
          .map((i) => i.text)
          .join(" ")
      );
    };
    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) <= Y_TOLERANCE) {
        currentRow.push(item);
        if (currentY === null) currentY = item.y;
      } else {
        flushRow();
        currentRow = [item];
        currentY = item.y;
      }
    }
    flushRow();
  }

  return lines.join("\n");
}

// ─── PDF: field extraction by content, not position ───────────────────────
// Longest phrase wins when two vocabulary entries could both match (e.g.
// "booked but not visited" over "booked", "not booked" over "booked") --
// enforced by comparing match POSITION, not list order, so the caller
// doesn't have to keep these lists carefully sorted.
const STATUS_VOCAB = [
  "booked but not visited",
  "not interested",
  "not booked",
  "not sold",
  "no answer",
  "voicemail",
  "cancelled",
  "canceled",
  "follow up",
  "converted",
  "booked",
  "sold",
  "lost",
  "won",
];

const SOURCE_VOCAB = [
  "optin claim for website",
  "existing customer",
  "google search",
  "word of mouth",
  "repeat client",
  "social media",
  "google maps",
  "google map",
  "google ads",
  "door hanger",
  "instagram",
  "nextdoor",
  "facebook",
  "referral",
  "walk in",
  "website",
  "flyer",
  "yelp",
];

const HEADER_LINE_HINTS = [
  "sr",
  "lead date",
  "name",
  "address",
  "number",
  "email",
  "status",
  "comment",
  "salesperson",
  "source",
  "phone",
];

const SUMMARY_LINE_RE =
  /total\s+number\s+of\s+leads|^follow\s*up\b|booked\s+but\s+not\s+visited\s*$|need\s+to\s+book/i;

const DATE_RE =
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{2,4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{2,4})?)\b/i;

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

const PHONE_PATTERN =
  "(?:\\+?1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b";

function trimPunct(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:-]+|[\s,;:-]+$/g, "")
    .trim();
}

// Skips column-header rows, sheet titles ("August 2026 Leads"), and the
// sheet's own totals block ("Total number of Leads...", "Follow up",
// "Booked but Not Visited", "Need to Book") -- the same categories
// isSummaryRow() strips from CSV/Excel rows in csvLeadParser.js, applied
// here to raw text lines instead of header-keyed row objects.
function looksLikeHeaderOrTitle(line) {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  if (SUMMARY_LINE_RE.test(lower)) return true;
  if (/^[a-z]+\s+\d{4}\s+leads?$/i.test(trimmed)) return true;

  const hintHits = HEADER_LINE_HINTS.filter((h) => lower.includes(h)).length;
  const hasPhoneDigits = new RegExp(PHONE_PATTERN).test(trimmed);
  if (hintHits >= 3 && !hasPhoneDigits) return true;

  return false;
}

// Finds the vocabulary phrase whose match sits furthest left (or right) in
// `text`, checking every phrase in the list rather than stopping at the
// first hit -- so a longer, more specific phrase ("not booked") correctly
// wins over a shorter one it contains ("booked") whenever it also starts
// earlier (or, for "rightmost", extends further).
function findVocabMatch(text, vocabList, which) {
  const lower = text.toLowerCase();
  let best = null;
  for (const phrase of vocabList) {
    const idx = lower.indexOf(phrase);
    if (idx === -1) continue;
    if (!best) {
      best = { text: phrase, index: idx, length: phrase.length };
      continue;
    }
    if (which === "leftmost" && idx < best.index) {
      best = { text: phrase, index: idx, length: phrase.length };
    } else if (which === "rightmost" && idx > best.index) {
      best = { text: phrase, index: idx, length: phrase.length };
    }
  }
  return best;
}

function removeMatch(text, hit) {
  if (!hit) return text;
  return text.slice(0, hit.index) + " " + text.slice(hit.index + hit.length);
}

// Parses one visual row of PDF text into a lead record, using content --
// never x-position -- to tell fields apart. This is deliberately
// best-effort: phone/email/date/status/source are reliable (regex and
// vocabulary matches are unambiguous), while name/address/comment/
// salesperson are inferred from what's left over and can be imperfect on
// unusual phrasing. That's why "Fix with Claude" remains available as an
// optional, more accurate re-read for any file, PDF included.
export function parseLeadLine(rawLine) {
  let text = String(rawLine || "").trim();

  // Leading "Sr #" index column, e.g. "12 John Smith ..." -> "John Smith ...".
  text = text.replace(/^\d{1,4}[.)]?\s+/, "");

  // Date.
  const dateMatch = text.match(DATE_RE);
  const date = dateMatch ? dateMatch[0].trim() : "";
  if (dateMatch) {
    text = text.slice(0, dateMatch.index) + " " + text.slice(dateMatch.index + dateMatch[0].length);
  }

  // Email.
  const emailMatch = text.match(EMAIL_RE);
  const email = emailMatch ? emailMatch[0].trim() : "";
  if (emailMatch) {
    text = text.slice(0, emailMatch.index) + " " + text.slice(emailMatch.index + emailMatch[0].length);
  }

  // Phone -- the first match's position anchors the split between the
  // "name + address" half of the line and the "comment/status/source/
  // salesperson" half, since every one of these sheets puts the phone
  // number between those two groups. All phone-shaped matches (including
  // a repeat mentioned in a comment) are then stripped from both halves.
  const phoneMatches = [...text.matchAll(new RegExp(PHONE_PATTERN, "g"))];
  const phone = phoneMatches.length ? phoneMatches[0][0].trim() : "";

  let namePart;
  let tailPart;
  if (phoneMatches.length) {
    const first = phoneMatches[0];
    namePart = text.slice(0, first.index);
    tailPart = text.slice(first.index + first[0].length);
  } else {
    // No phone found on this line -- can't reliably tell where the name/
    // address half ends, so keep everything as the "before" half rather
    // than guessing where a comment might start.
    namePart = text;
    tailPart = "";
  }
  const phoneStripRe = new RegExp(PHONE_PATTERN, "g");
  namePart = namePart.replace(phoneStripRe, " ");
  tailPart = tailPart.replace(new RegExp(PHONE_PATTERN, "g"), " ");

  // Status -- leftmost vocabulary hit in the tail (status is usually the
  // first thing recorded right after the phone number).
  const statusHit = findVocabMatch(tailPart, STATUS_VOCAB, "leftmost");
  const afterStatus = removeMatch(tailPart, statusHit);

  // Source -- rightmost vocabulary hit in what's left (source tends to
  // sit near the end of the row, close to the salesperson's name).
  const sourceHit = findVocabMatch(afterStatus, SOURCE_VOCAB, "rightmost");
  const afterSource = removeMatch(afterStatus, sourceHit);

  // Salesperson -- a trailing Title-Cased name (first + optional last) at
  // the very end of what's left. Capped at two words so a comment that
  // happens to start with a capitalized word ("Reschedule Maria Lopez")
  // doesn't get partly swallowed into the name. Only accepted when
  // something else precedes it (index > 0); if the entire remaining tail
  // IS the Title-Cased text, it's ambiguous whether that's a salesperson
  // or just a short comment, so it's left as comment instead of guessed
  // as a name.
  const salespersonMatch = afterSource.match(/([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,1})\s*$/);
  let comment = afterSource;
  let salesperson = "";
  if (salespersonMatch && salespersonMatch.index > 0) {
    salesperson = trimPunct(salespersonMatch[1]);
    comment = afterSource.slice(0, salespersonMatch.index);
  }

  // Name / Address within the "before phone" half: these sheets are
  // hand-typed as "<Name> <house number> <street...>", so the address is
  // taken to start at the first standalone number -- everything before
  // that is the name, from there on is the address.
  const cleanedNamePart = namePart.replace(/\s+/g, " ").trim();
  const addressStart = cleanedNamePart.match(/\b\d+[a-zA-Z]?\b/);
  let name = cleanedNamePart;
  let address = "";
  if (addressStart) {
    name = cleanedNamePart.slice(0, addressStart.index);
    address = cleanedNamePart.slice(addressStart.index);
  }

  return {
    name: trimPunct(name),
    businessName: "",
    phone,
    email,
    address: trimPunct(address),
    comment: trimPunct(comment),
    status: statusHit ? statusHit.text : "",
    stage: "",
    salesperson,
    source: sourceHit ? sourceHit.text : "",
    date,
  };
}

export function parseLeadSheetText(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !looksLikeHeaderOrTitle(l))
    .map(parseLeadLine)
    .filter((r) => r && (r.name || r.phone || r.address || r.email));
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
    const rawText = await extractPdfText(file);
    return { rows: parseLeadSheetText(rawText), rawText, format: "pdf" };
  }
  throw new Error(`Unsupported file type: "${file.name}". Upload a .csv, .xlsx, or .pdf file.`);
}
