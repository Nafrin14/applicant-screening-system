import { lookupAccount } from './accountMapping';

// ─── HELPER: Robust field lookup ────────────────────────────────────────
// Matches headers regardless of case, spacing, or variations
export function getField(row, candidates) {
  // Normalize row keys to lowercase trimmed
  const normalizedRow = {};
  Object.keys(row).forEach(k => {
    normalizedRow[k.trim().toLowerCase()] = row[k];
  });

  for (const c of candidates) {
    const val = normalizedRow[c.trim().toLowerCase()];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

const DATE_FIELD_CANDIDATES = [
  "Created on",
  "Date",
  "Created Date",
  "Lead Date",
  "Create Date",
  "Creation Date",
  "Date Created"
];

// ─── HELPER: Detect sheet-embedded summary/totals rows ───────────────────
// The master sheets salespeople actually upload end with their own totals
// block -- "Total number of Leads", "Total number of Leads Converted",
// "Total number of Leads Lost", "Follow up", "Booked but Not Visited",
// "Need to Book" -- sitting in the same columns as the lead rows above it.
// A naive row-by-row import inserts these as fake leads, so they're
// filtered out before any field mapping happens.
const SUMMARY_ROW_PATTERNS = [
  /^total\s+number\s+of\s+leads/i,
  /^follow\s*up$/i,
  /^booked\s+but\s+not\s+visited$/i,
  /^need\s+to\s+book$/i,
];

function isSummaryRow(row) {
  return Object.values(row).some((v) => {
    const s = String(v ?? "").trim();
    return s && SUMMARY_ROW_PATTERNS.some((p) => p.test(s));
  });
}

// ─── HELPER: Normalize inconsistent lead dates ────────────────────────────
// The same sheet mixes "8/1/2026" with hand-typed, year-less dates like
// "20th Aug" or "31 Aug". Native Date parsing chokes on both the ordinal
// suffix and the missing year, which silently breaks the report's
// "as of" date resolution (generateAuditPdf.js) and any date sorting.
// This normalizes whatever it can recognize to an ISO yyyy-mm-dd string,
// borrowing a year from elsewhere in the same upload batch when a row
// doesn't state one, and otherwise leaves the raw text untouched rather
// than silently dropping it.
const MONTH_NAMES_RE = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

function stripOrdinalSuffix(s) {
  return s.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1");
}

function detectYearHint(rawDates) {
  const counts = {};
  rawDates.forEach((raw) => {
    const m = String(raw || "").match(/\b(20\d{2})\b/);
    if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
  });
  const years = Object.keys(counts);
  if (!years.length) return null;
  return years.sort((a, b) => counts[b] - counts[a])[0];
}

export function normalizeLeadDate(raw, yearHint) {
  const s = stripOrdinalSuffix(String(raw || "").trim());
  if (!s) return "";

  // M/D/YYYY or M/D/YY
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mo, d, y] = m;
    if (y.length === 2) y = `20${y}`;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  }

  // "Aug 20", "20 Aug", or either with a year appended -- with or without
  // a stated year, e.g. "20th Aug" (ordinal already stripped above) or
  // "31 Aug 2026".
  const monthMatch = s.match(new RegExp(`(${MONTH_NAMES_RE})[a-z]*`, "i"));
  const dayMatch = s.match(/\b(\d{1,2})\b/);
  const yearMatch = s.match(/\b(20\d{2})\b/);
  if (monthMatch && dayMatch) {
    const year = yearMatch ? yearMatch[1] : yearHint || String(new Date().getFullYear());
    const dt = new Date(`${monthMatch[0]} ${dayMatch[1]}, ${year}`);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  }

  // Unrecognized format -- keep the original text rather than lose the row's date entirely.
  return s;
}

function detectBusinessLine(fileName) {
  if (fileName.includes("fence") || fileName.includes("fencing")) {
    return "Fencing";
  } else if (fileName.includes("tree") || fileName.includes("branch")) {
    return "Tree Service";
  } else if (fileName.includes("landscaping") || fileName.includes("landscap")) {
    return "Landscaping";
  } else if (fileName.includes("pool")) {
    return "Pool Building";
  } else if (fileName.includes("power wash") || fileName.includes("powerwash")) {
    return "Power Washing";
  } else if (fileName.includes("snow") || fileName.includes("plow")) {
    return "Snow Removal";
  }
  return "General Pipeline";
}

// ─────────────────────────────────────────────────────────────────────────
// Turns Papa Parse's raw CSV rows into `sales_leads` insert rows: resolves
// the region/salesperson from the filename (via lookupAccount), detects the
// business line, and maps each row's columns with getField's fuzzy header
// matching. Mirrors the original inline logic exactly, warnings included.
//
// `assignmentMap` (optional: { [businessLocation]: salespersonName }, read
// from the business_assignments table) takes priority over the static
// ACCOUNT_MAPPING fallback for the salesperson written on each row -- the
// static mapping only fires when a business has no assignment configured
// yet. The Final Lead Report itself re-resolves salesperson from
// business_assignments at generation time regardless of what's stored
// here, so this value is really just an upload-time audit trail, not the
// report's source of truth.
// ─────────────────────────────────────────────────────────────────────────
export function buildLeadRows(rows, { fileName, userId, csvUploadId, assignmentMap = {} }) {
  const lowerFileName = fileName.toLowerCase();
  const match = lookupAccount(lowerFileName);

  const location = match?.region || "Other / Unassigned";
  const salesperson = assignmentMap?.[location] || match?.salesperson || "Unassigned";
  const businessLine = detectBusinessLine(lowerFileName);

  console.log("STEP 3.5 - Matched account:", match, "| resolved salesperson:", salesperson);

  // ─── FIX: Strip the sheet's own totals block before mapping any rows ───
  const cleanRows = rows.filter((row) => !isSummaryRow(row));
  const strippedCount = rows.length - cleanRows.length;
  if (strippedCount > 0) {
    console.log(`STEP 3.6 - Stripped ${strippedCount} embedded summary/totals row(s) from "${fileName}".`);
  }

  const yearHint = detectYearHint(cleanRows.map((row) => getField(row, DATE_FIELD_CANDIDATES)));

  const leadRows = cleanRows.map((row) => {
    const stage = getField(row, [
      "Stage",
      "Deal Stage",
      "Opportunity Stage",
      "Pipeline Stage",
      "Lead Status",
      "Status",
      "Sales Stage"
    ]);

    // Final Status is the lead's outcome (Booked / Not Booked / Job Sold /
    // Cancelled / Not Interested, etc.) as some salespersons' sheets record
    // it directly -- distinct from Stage, which is the CRM pipeline step.
    // Falls back to whatever's in a generic "Status" column if there's no
    // dedicated Final Status column, then to the stage itself.
    const finalStatus = getField(row, [
      "Final Status",
      "Status",
      "Deal Status",
      "Result",
      "Outcome"
    ]);

    return {
      user_id: userId,
      csv_upload_id: csvUploadId,
      name: getField(row, [
        "Opportunity name",
        "Primary Contact name",
        "Name",
        "Contact Name",
        "Full Name",
        "Customer Name",
        "Lead Name"
      ]),
      phone: getField(row, [
        "Phone number",
        "Phone",
        "Mobile",
        "Contact Number",
        "Phone Number",
        "Cell Phone",
        "Mobile Phone"
      ]),
      address: getField(row, [
        "Address",
        "Property Address",
        "Street Address",
        "Location Address",
        "Full Address"
      ]),
      comment: getField(row, [
        "Comment",
        "Comments",
        "Notes",
        "Note",
        "Remark",
        "Remarks"
      ]),
      // Where the customer heard about us -- Google, Repeat Client, Optin
      // Claim for Website, etc.
      source: getField(row, [
        "Source",
        "Lead Source",
        "Referral Source",
        "How did you hear about us",
        "Campaign Source",
        "Campaign"
      ]),
      location,
      business_line: businessLine,
      salesperson,
      stage,
      last_stage: stage,
      final_status: finalStatus,
      lead_date: normalizeLeadDate(getField(row, DATE_FIELD_CANDIDATES), yearHint),
    };
  });

  // ─── FIX: Warn if Stage is missing ──────────────────────────
  const emptyStageCount = leadRows.filter(r => !r.stage).length;
  if (emptyStageCount > 0) {
    console.warn(`⚠️ ${emptyStageCount}/${leadRows.length} rows in "${fileName}" have no Stage value — check CSV header naming.`);
  }

  // ─── FIX: Warn if Name is missing ───────────────────────────
  const emptyNameCount = leadRows.filter(r => !r.name).length;
  if (emptyNameCount > 0) {
    console.warn(`⚠️ ${emptyNameCount}/${leadRows.length} rows in "${fileName}" have no Name value — check CSV header naming.`);
  }

  console.log("STEP 4 - Lead rows built:", leadRows.length);
  console.log("STEP 5 - First lead row:", leadRows[0]);

  return leadRows;
}
