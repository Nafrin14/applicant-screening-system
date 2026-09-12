// ─── ACCOUNT MAPPING ──────────────────────────────────────────────────────
// Map account names to region + salesperson
export const ACCOUNT_MAPPING = {
  // ROCHESTER — Habil
  "all pro landscaping":        { region: "Rochester", salesperson: "Habil" },
  "bills tress":                { region: "Rochester", salesperson: "Habil" },
  "branch specialist rochester":{ region: "Rochester", salesperson: "Habil" },
  "kd fence and desks":         { region: "Rochester", salesperson: "Habil" },
  "kd landscaping rochester":   { region: "Rochester", salesperson: "Habil" },
  "kd tree service rochester":  { region: "Rochester", salesperson: "Habil" },
  "marbel landscaping rochester":{ region: "Rochester", salesperson: "Habil" },

  // ALBANY — Rahul
  "kd tree albany":             { region: "Albany", salesperson: "Rahul" },
  "kd fence albany":            { region: "Albany", salesperson: "Rahul" },
  "kd landscaping albany":      { region: "Albany", salesperson: "Rahul" },

  // SYRACUSE — Aqsa
  "kd tree syracuse":           { region: "Syracuse", salesperson: "Aqsa" },
  "kd fence syracuse":          { region: "Syracuse", salesperson: "Aqsa" },
  "kd landscaping syracuse":    { region: "Syracuse", salesperson: "Aqsa" },
  "snowiest city tree service": { region: "Syracuse", salesperson: "Aqsa" },
  "syracuse tree service":      { region: "Syracuse", salesperson: "Aqsa" },

  // BUFFALO — Anusha
  "soil & seed landscaping":    { region: "Buffalo", salesperson: "Anusha" },
  "all pro fence":              { region: "Buffalo", salesperson: "Anusha" },
  "redefine landscaping buffalo":{ region: "Buffalo", salesperson: "Anusha" },
  "branch specialists buffalo": { region: "Buffalo", salesperson: "Anusha" },

  // BUFFALO — Raj
  "kd tree buffalo":            { region: "Buffalo", salesperson: "Raj" },
  "kd fence buffalo":           { region: "Buffalo", salesperson: "Raj" },
  "kd pool builders":           { region: "Buffalo", salesperson: "Raj" },

  // BUFFALO — Chirag
  "kd landscaping and snow plowing": { region: "Buffalo", salesperson: "Chirag" },

  // ERIE — Vidhya
  "kd landscaping erie":        { region: "Erie", salesperson: "Vidhya" },

  // BELMONT/MOORE — Shakeel
  "kd tree belmont":            { region: "Belmont", salesperson: "Shakeel" },
  "kd tree service moore":      { region: "Moore", salesperson: "Shakeel" },
};

// Fallback region-only lookup if account name match fails
export const ACCOUNT_OWNERS = {
  Albany:    "Rahul",
  Rochester: "Habil",
  Syracuse:  "Aqsa",
  Buffalo:   "Anusha",
};

// ─── HELPER: Match filename to account ──────────────────────────────────
export function lookupAccount(fileName) {
  const cleanName = fileName.toLowerCase().replace(/\.csv$/, '');

  // Try exact substring match against known account names
  for (const [key, value] of Object.entries(ACCOUNT_MAPPING)) {
    if (cleanName.includes(key)) {
      return { accountName: key, ...value };
    }
  }

  // If no match, try to detect by city name
  let region = "Other / Unassigned";
  let salesperson = "Unassigned";

  if (cleanName.includes("albany")) {
    region = "Albany";
    salesperson = ACCOUNT_OWNERS["Albany"];
  } else if (cleanName.includes("rochester")) {
    region = "Rochester";
    salesperson = ACCOUNT_OWNERS["Rochester"];
  } else if (cleanName.includes("syracuse")) {
    region = "Syracuse";
    salesperson = ACCOUNT_OWNERS["Syracuse"];
  } else if (cleanName.includes("buffalo")) {
    region = "Buffalo";
    salesperson = ACCOUNT_OWNERS["Buffalo"];
  } else if (cleanName.includes("nyc") || cleanName.includes("new york")) {
    region = "NYC Metro";
    salesperson = "Unassigned";
  }

  return { accountName: cleanName, region, salesperson };
}
