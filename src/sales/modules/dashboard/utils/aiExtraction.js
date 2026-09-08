import axios from "axios";
import { supabase } from "../../../../core/lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const EXTRACT_URL = `${API_BASE}/api/sales-admin/data-comparison/extract`;

// ─────────────────────────────────────────────────────────────────────────
// Sends raw file text to the server, which asks Claude to extract clean,
// structured lead records from it (server/routes/salesAdmin.js). Used for:
//   - PDF uploads, where positional column reconstruction is unreliable
//     enough that this is now the only way PDFs get turned into rows at
//     all (see fileParsers.js's comment on why the old approach was
//     dropped).
//   - The "Fix with Claude" action on a CSV/Excel upload whose columns
//     came out wrong -- e.g. an unquoted comma inside an address shifting
//     every field after it one column to the right.
//
// Requires an admin session (same Bearer-token pattern as
// useUserManagement.js's callSalesAdminApi) and ANTHROPIC_API_KEY set on
// the server -- if that's missing, the server returns 501 with
// code: 'ANTHROPIC_NOT_CONFIGURED' so the caller can show a clear message
// instead of a generic failure.
// ─────────────────────────────────────────────────────────────────────────
export async function extractRecordsWithClaude(text, fileName) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Your admin session has expired. Please log in again.");
  }

  try {
    const res = await axios.post(
      EXTRACT_URL,
      { text, fileName },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 95000 }
    );
    return res.data; // { records, truncated }
  } catch (err) {
    const serverMessage = err.response?.data?.error;
    const code = err.response?.data?.code;
    const error = new Error(serverMessage || err.message || "AI extraction request failed.");
    error.code = code;
    throw error;
  }
}
