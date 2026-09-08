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
// ─────────────────────────────────────────────────────────────────────────
export function buildLeadRows(rows, { fileName, userId, csvUploadId }) {
  const lowerFileName = fileName.toLowerCase();
  const match = lookupAccount(lowerFileName);

  const location = match?.region || "Other / Unassigned";
  const salesperson = match?.salesperson || "Unassigned";
  const businessLine = detectBusinessLine(lowerFileName);

  console.log("STEP 3.5 - Matched account:", match);

  const leadRows = rows.map((row) => ({
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
    location,
    business_line: businessLine,
    salesperson,
    stage: getField(row, [
      "Stage",
      "Deal Stage",
      "Opportunity Stage",
      "Pipeline Stage",
      "Lead Status",
      "Status",
      "Sales Stage"
    ]),
    lead_date: getField(row, [
      "Created on",
      "Date",
      "Created Date",
      "Lead Date",
      "Create Date",
      "Creation Date",
      "Date Created"
    ]),
  }));

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
