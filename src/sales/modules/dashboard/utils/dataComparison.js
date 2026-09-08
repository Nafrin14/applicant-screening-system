import { getField } from "./csvLeadParser";

// ─────────────────────────────────────────────────────────────────────────
// Master Data vs GHL Lead Data comparison engine for the Data Comparison
// tab. Both inputs are already header-keyed row objects (from
// fileParsers.parseDataFile) -- this file normalizes them into a common
// shape, matches records across the two sources by the best identifiers
// each pair actually has, and reports mismatches, duplicates, and
// incomplete rows.
// ─────────────────────────────────────────────────────────────────────────

// ─── Row normalization ──────────────────────────────────────────────────
// Reuses getField's fuzzy header matching (same helper csvLeadParser.js
// uses for sales_leads ingestion) so both the master sheets' and GHL's
// differently-named columns land in the same fields.
export function normalizeRecord(row, index) {
  return {
    _index: index,
    id: getField(row, ["Lead ID", "Opportunity ID", "Record ID", "ID"]),
    businessName: getField(row, ["Business Name", "Company", "Company Name", "Opportunity name"]),
    name: getField(row, ["Name", "Contact Name", "Full Name", "Customer Name", "Lead Name", "Primary Contact name"]),
    phone: getField(row, ["Phone", "Phone number", "Number", "Mobile", "Contact Number", "Phone Number", "Cell Phone", "Mobile Phone"]),
    email: getField(row, ["Email", "Email Address", "Contact Email"]),
    address: getField(row, ["Address", "Property Address", "Street Address", "Location Address", "Full Address"]),
    comment: getField(row, ["Comment", "Comments", "Notes", "Note", "Remark", "Remarks"]),
    status: getField(row, ["Final Status", "Status", "Deal Status", "Result", "Outcome"]),
    stage: getField(row, ["Stage", "Deal Stage", "Opportunity Stage", "Pipeline Stage", "Lead Status", "Sales Stage"]),
    salesperson: getField(row, ["Salesperson", "Sales Person", "Sales person", "Assigned To", "Rep"]),
    source: getField(row, ["Source", "Lead Source", "Referral Source", "How did you hear about us", "How customer got to know about us", "Campaign Source", "Campaign"]),
    date: getField(row, ["Date", "Lead Date", "Created on", "Created Date", "Create Date", "Creation Date", "Date Created"]),
    _raw: row,
  };
}

// ─── Field normalization helpers ────────────────────────────────────────
export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  // Strip a leading US country code so "+1 518…" and "518…" compare equal.
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ADDRESS_ABBREVIATIONS = {
  street: "st", avenue: "ave", road: "rd", drive: "dr", lane: "ln",
  court: "ct", place: "pl", boulevard: "blvd", terrace: "ter", trail: "trl",
};

export function normalizeAddress(address) {
  let s = normalizeText(address);
  Object.entries(ADDRESS_ABBREVIATIONS).forEach(([full, abbr]) => {
    s = s.replace(new RegExp(`\\b${full}\\b`, "g"), abbr);
  });
  return s;
}

// ─── Similarity (Levenshtein-based) ─────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curRow = [i];
    for (let j = 1; j <= n; j++) {
      curRow[j] = a[i - 1] === b[j - 1]
        ? prevRow[j - 1]
        : 1 + Math.min(prevRow[j - 1], prevRow[j], curRow[j - 1]);
    }
    prevRow = curRow;
  }
  return prevRow[n];
}

// Returns 0..1 (1 = identical). Compares already-normalized strings.
export function similarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// ─── Cross-source record matching ───────────────────────────────────────
// Weighted so an exact phone/email/ID match alone is enough to call a
// pair the same record (that's a "strong signal"), while name/address
// similarity are supporting evidence used when neither source has a
// reliable identifier -- exactly the situation these hand-typed sheets
// are usually in.
const FIELD_WEIGHTS = { id: 0.4, phone: 0.35, email: 0.15, name: 0.25, businessName: 0.15, address: 0.15 };
const MATCH_THRESHOLD = 0.5;
const NAME_SIM_FLOOR = 0.72;
const ADDRESS_SIM_FLOOR = 0.6;

export function matchScore(a, b) {
  let score = 0;
  let maxPossible = 0;
  const reasons = [];

  if (a.id && b.id) {
    maxPossible += FIELD_WEIGHTS.id;
    if (a.id.trim().toLowerCase() === b.id.trim().toLowerCase()) { score += FIELD_WEIGHTS.id; reasons.push("id"); }
  }

  const pa = normalizePhone(a.phone), pb = normalizePhone(b.phone);
  if (pa && pb) {
    maxPossible += FIELD_WEIGHTS.phone;
    if (pa === pb) { score += FIELD_WEIGHTS.phone; reasons.push("phone"); }
  }

  const ea = normalizeEmail(a.email), eb = normalizeEmail(b.email);
  if (ea && eb) {
    maxPossible += FIELD_WEIGHTS.email;
    if (ea === eb) { score += FIELD_WEIGHTS.email; reasons.push("email"); }
  }

  if (a.name && b.name) {
    maxPossible += FIELD_WEIGHTS.name;
    const sim = similarity(normalizeText(a.name), normalizeText(b.name));
    if (sim >= NAME_SIM_FLOOR) { score += FIELD_WEIGHTS.name * sim; reasons.push("name"); }
  }

  if (a.businessName && b.businessName) {
    maxPossible += FIELD_WEIGHTS.businessName;
    const sim = similarity(normalizeText(a.businessName), normalizeText(b.businessName));
    if (sim >= NAME_SIM_FLOOR) { score += FIELD_WEIGHTS.businessName * sim; reasons.push("businessName"); }
  }

  if (a.address && b.address) {
    maxPossible += FIELD_WEIGHTS.address;
    const sim = similarity(normalizeAddress(a.address), normalizeAddress(b.address));
    if (sim >= ADDRESS_SIM_FLOOR) { score += FIELD_WEIGHTS.address * sim; reasons.push("address"); }
  }

  const confidence = maxPossible > 0 ? score / maxPossible : 0;
  const hasStrongSignal = reasons.includes("id") || reasons.includes("phone") || reasons.includes("email");
  return { confidence, reasons, hasStrongSignal };
}

// Greedy best-match: for each Master row, claims the best still-available
// GHL row that clears the match bar. O(masters × ghl) -- fine at the
// hundreds-of-rows scale these sheets run at.
export function matchRecords(masterRecords, ghlRecords) {
  const claimedGhl = new Set();
  const matched = [];
  const missingFromGhl = [];

  masterRecords.forEach((master) => {
    let best = null;
    let bestResult = null;
    ghlRecords.forEach((ghl) => {
      if (claimedGhl.has(ghl._index)) return;
      const result = matchScore(master, ghl);
      if (result.hasStrongSignal || result.confidence >= MATCH_THRESHOLD) {
        if (!bestResult || result.confidence > bestResult.confidence) {
          best = ghl;
          bestResult = result;
        }
      }
    });
    if (best) {
      claimedGhl.add(best._index);
      matched.push({ master, ghl: best, score: bestResult });
    } else {
      missingFromGhl.push({ master });
    }
  });

  const extraInGhl = ghlRecords.filter((g) => !claimedGhl.has(g._index)).map((ghl) => ({ ghl }));

  return { matched, missingFromGhl, extraInGhl };
}

// ─── Field-level diff for a matched pair ────────────────────────────────
const COMPARE_FIELDS = [
  { key: "businessName", label: "Business Name" },
  { key: "name", label: "Customer Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "salesperson", label: "Salesperson" },
  { key: "status", label: "Status" },
  { key: "stage", label: "Stage" },
  { key: "comment", label: "Comment" },
];

function fieldsEqual(key, a, b) {
  if (key === "phone") return normalizePhone(a) === normalizePhone(b);
  if (key === "email") return normalizeEmail(a) === normalizeEmail(b);
  if (key === "address") return similarity(normalizeAddress(a), normalizeAddress(b)) >= 0.85;
  const na = normalizeText(a), nb = normalizeText(b);
  if (na === nb) return true;
  if (!na || !nb) return false;
  // Small typo/casing allowance on free-text fields (salesperson, status,
  // stage, comment) without letting genuinely different values pass.
  return similarity(na, nb) >= 0.9;
}

export function compareFields(master, ghl) {
  return COMPARE_FIELDS
    .map(({ key, label }) => {
      const masterValue = master[key] || "";
      const ghlValue = ghl[key] || "";
      if (!masterValue && !ghlValue) return null;
      return { field: label, key, masterValue: masterValue || "—", ghlValue: ghlValue || "—", match: fieldsEqual(key, masterValue, ghlValue) };
    })
    .filter(Boolean);
}

// ─── Duplicate detection (within one source) ────────────────────────────
export function detectDuplicates(records) {
  const byPhone = new Map();
  const byNameAddress = new Map();

  records.forEach((r) => {
    const phone = normalizePhone(r.phone);
    if (phone) {
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone).push(r);
    }
    if (r.name && r.address) {
      const key = `${normalizeText(r.name)}|${normalizeAddress(r.address)}`;
      if (!byNameAddress.has(key)) byNameAddress.set(key, []);
      byNameAddress.get(key).push(r);
    }
  });

  const groups = [];
  const seenIndexSets = new Set();
  const pushGroup = (recs, reason) => {
    const key = recs.map((r) => r._index).sort((a, b) => a - b).join(",");
    if (seenIndexSets.has(key)) return;
    seenIndexSets.add(key);
    groups.push({ reason, records: recs });
  };

  byPhone.forEach((recs) => { if (recs.length > 1) pushGroup(recs, "Same phone number"); });
  byNameAddress.forEach((recs) => { if (recs.length > 1) pushGroup(recs, "Same name + address"); });

  return groups;
}

// ─── Incomplete / missing-field detection ───────────────────────────────
// Flags a row as incomplete when it's missing a way to reach the lead
// (phone or email), an identity (name or business name), or an address --
// the fields an admin would actually need to chase the lead down or spot
// it as a duplicate.
export function detectIncomplete(records) {
  return records.filter((r) => !(r.phone || r.email) || !(r.name || r.businessName) || !r.address);
}

// ─── Top-level orchestrator ──────────────────────────────────────────────
export function runComparison(masterRows, ghlRows) {
  const masterRecords = masterRows.map(normalizeRecord);
  const ghlRecords = ghlRows.map(normalizeRecord);

  const { matched, missingFromGhl, extraInGhl } = matchRecords(masterRecords, ghlRecords);

  const matchedWithDiff = matched.map((pair) => {
    const fields = compareFields(pair.master, pair.ghl);
    const hasMismatch = fields.some((f) => !f.match);
    return { ...pair, fields, hasMismatch };
  });
  const mismatched = matchedWithDiff.filter((m) => m.hasMismatch);

  const masterDuplicates = detectDuplicates(masterRecords);
  const ghlDuplicates = detectDuplicates(ghlRecords);
  const incomplete = [
    ...detectIncomplete(masterRecords).map((record) => ({ record, sourceLabel: "Master Data" })),
    ...detectIncomplete(ghlRecords).map((record) => ({ record, sourceLabel: "GHL Data" })),
  ];

  const summary = {
    totalMaster: masterRecords.length,
    totalGhl: ghlRecords.length,
    matched: matchedWithDiff.length,
    mismatched: mismatched.length,
    missingFromGhl: missingFromGhl.length,
    extraInGhl: extraInGhl.length,
    duplicatesMaster: masterDuplicates.reduce((sum, g) => sum + g.records.length, 0),
    duplicatesGhl: ghlDuplicates.reduce((sum, g) => sum + g.records.length, 0),
    incomplete: incomplete.length,
  };

  return { masterRecords, ghlRecords, matched: matchedWithDiff, mismatched, missingFromGhl, extraInGhl, masterDuplicates, ghlDuplicates, incomplete, summary };
}
