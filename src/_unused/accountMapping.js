

export const ACCOUNT_MAPPING = {
  // ── ROCHESTER — Habil ─────────────────────────────────────────────────────
  "all pro landscaping":           { region: "Rochester", salesperson: "Habil" },
  "bills tress":                   { region: "Rochester", salesperson: "Habil" },
  "bills trees":                   { region: "Rochester", salesperson: "Habil" },
  "branch specialist rochester":   { region: "Rochester", salesperson: "Habil" },
  "branch specialists rochester":  { region: "Rochester", salesperson: "Habil" },
  "kd fence and desks":            { region: "Rochester", salesperson: "Habil" },
  "kd landscaping rochester":      { region: "Rochester", salesperson: "Habil" },
  "kd tree service rochester":     { region: "Rochester", salesperson: "Habil" },
  "kd tree rochester":             { region: "Rochester", salesperson: "Habil" },
  "kd fence rochester":            { region: "Rochester", salesperson: "Habil" },
  "marbel landscaping rochester":  { region: "Rochester", salesperson: "Habil" },
  "marble landscaping rochester":  { region: "Rochester", salesperson: "Habil" },

  // ── ALBANY — Rahul ────────────────────────────────────────────────────────
  "kd tree albany":                { region: "Albany", salesperson: "Rahul" },
  "kd fence albany":               { region: "Albany", salesperson: "Rahul" },
  "kd landscaping albany":         { region: "Albany", salesperson: "Rahul" },
  "kd tree service albany":        { region: "Albany", salesperson: "Rahul" },

  // ── SYRACUSE — Aqsa ──────────────────────────────────────────────────────
  "kd tree syracuse":              { region: "Syracuse", salesperson: "Aqsa" },
  "kd fence syracuse":             { region: "Syracuse", salesperson: "Aqsa" },
  "kd landscaping syracuse":       { region: "Syracuse", salesperson: "Aqsa" },
  "kd tree service syracuse":      { region: "Syracuse", salesperson: "Aqsa" },
  "snowiest city tree service":    { region: "Syracuse", salesperson: "Aqsa" },
  "syracuse tree service":         { region: "Syracuse", salesperson: "Aqsa" },

  // ── BUFFALO — Anusha ─────────────────────────────────────────────────────
  "soil & seed landscaping":       { region: "Buffalo", salesperson: "Anusha" },
  "soil and seed landscaping":     { region: "Buffalo", salesperson: "Anusha" },
  "all pro fence":                 { region: "Buffalo", salesperson: "Anusha" },
  "redefine landscaping buffalo":  { region: "Buffalo", salesperson: "Anusha" },
  "branch specialists buffalo":    { region: "Buffalo", salesperson: "Anusha" },
  "branch specialist buffalo":     { region: "Buffalo", salesperson: "Anusha" },

  // ── BUFFALO — Raj ────────────────────────────────────────────────────────
  "kd tree buffalo":               { region: "Buffalo", salesperson: "Raj" },
  "kd fence buffalo":              { region: "Buffalo", salesperson: "Raj" },
  "kd pool builders":              { region: "Buffalo", salesperson: "Raj" },
  "kd tree service buffalo":       { region: "Buffalo", salesperson: "Raj" },

  // ── BUFFALO — Chirag ─────────────────────────────────────────────────────
  "kd landscaping and snow plowing": { region: "Buffalo", salesperson: "Chirag" },
  "kd landscaping buffalo":          { region: "Buffalo", salesperson: "Chirag" },
  "kd snow plowing buffalo":         { region: "Buffalo", salesperson: "Chirag" },

  // ── ERIE — Vidhya ────────────────────────────────────────────────────────
  "kd landscaping erie":           { region: "Erie", salesperson: "Vidhya" },
  "kd tree erie":                  { region: "Erie", salesperson: "Vidhya" },
  "kd fence erie":                 { region: "Erie", salesperson: "Vidhya" },
  "kd tree service erie":          { region: "Erie", salesperson: "Vidhya" },

  // ── BELMONT / MOORE — Shakeel ────────────────────────────────────────────
  "kd tree belmont":               { region: "Belmont", salesperson: "Shakeel" },
  "kd tree service moore":         { region: "Moore",   salesperson: "Shakeel" },
  "kd fence belmont":              { region: "Belmont", salesperson: "Shakeel" },
  "kd landscaping belmont":        { region: "Belmont", salesperson: "Shakeel" },
};

// ── Fallback: region keyword → salesperson (used when account name doesn't match) ──
export const ACCOUNT_OWNERS = {
  Albany:    "Rahul",
  Rochester: "Habil",
  Syracuse:  "Aqsa",
  Buffalo:   "Anusha",   // default Buffalo owner; Raj/Chirag matched via ACCOUNT_MAPPING
  Erie:      "Vidhya",
  Belmont:   "Shakeel",
  Moore:     "Shakeel",
};

// ── Lookup helper: match a filename or account string to { region, salesperson } ──
// Usage: const match = lookupAccount("KD Tree Albany Contacts.csv")
export function lookupAccount(rawString) {
  if (!rawString) return null;
  const key = rawString.toLowerCase().replace(/[_\-\.]/g, ' ').trim();

  // 1. Try exact match against ACCOUNT_MAPPING keys
  if (ACCOUNT_MAPPING[key]) return ACCOUNT_MAPPING[key];

  // 2. Try partial/substring match (account name appears inside filename)
  const accountKeys = Object.keys(ACCOUNT_MAPPING);
  for (const accKey of accountKeys) {
    if (key.includes(accKey)) return ACCOUNT_MAPPING[accKey];
  }

  // 3. Fallback: detect region keyword in the string
  for (const [region, salesperson] of Object.entries(ACCOUNT_OWNERS)) {
    if (key.includes(region.toLowerCase())) return { region, salesperson };
  }

  return null; // no match found
}

// ── Region display order for PDF report ──────────────────────────────────────
export const REGION_ORDER = [
  'Albany',
  'Buffalo',
  'Rochester',
  'Syracuse',
  'Erie',
  'Belmont',
  'Moore',
];