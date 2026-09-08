const express = require("express");
const axios = require("axios");
const { getSupabaseAdmin } = require("../lib/supabaseAdmin");

const router = express.Router();

// Only company addresses on this domain may be created/updated as Sales
// Dashboard users. Personal domains (gmail.com, yahoo.com, outlook.com, etc.)
// are rejected by construction — this is the single source of truth for that
// rule on the server side.
const SALES_EMAIL_DOMAIN = "kdmarketinggroup.org";
const SALES_EMAIL_REGEX = /^[^\s@]+@kdmarketinggroup\.org$/i;

function isValidSalesEmail(email) {
  return typeof email === "string" && SALES_EMAIL_REGEX.test(email.trim());
}

// Verifies the caller is a signed-in, active Sales Admin using the app's
// EXISTING Supabase Auth session (the same access token the browser already
// holds after login) — this is not a new auth system, just a server-side
// check that the request is really coming from an authenticated admin before
// letting it create/edit/deactivate other users' logins.
async function requireSalesAdmin(req, res, next) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing admin session token." });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid or expired admin session." });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin" || profile.is_active === false) {
      return res.status(403).json({ error: "Sales Admin access required." });
    }

    req.adminUser = userData.user;
    next();
  } catch (err) {
    console.error("[salesAdmin] auth check failed:", err);
    res.status(500).json({ error: "Could not verify admin session." });
  }
}

router.use(requireSalesAdmin);

// POST /api/sales-admin/users/create
// Admin manually creates a Sales user's login (name + @kdmarketinggroup.org
// email + password) via the Supabase Admin API. email_confirm:true is set so
// the user can log in immediately — no invitation, no OTP, no OAuth.
router.post("/users/create", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const name = (req.body?.name || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!name) return res.status(400).json({ error: "Name is required." });
    if (!isValidSalesEmail(email)) {
      return res.status(400).json({ error: `Email must be a valid @${SALES_EMAIL_DOMAIN} address.` });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "user" },
    });

    if (createError) {
      const msg = /already been registered|already exists/i.test(createError.message || "")
        ? "A user with this email already exists."
        : createError.message;
      return res.status(400).json({ error: msg });
    }

    const newUserId = created.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: newUserId, name, email, role: "user", is_active: true }, { onConflict: "id" });

    if (profileError) {
      // Don't leave an orphaned login with no profile row behind.
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      return res.status(500).json({ error: "User auth account created but profile save failed: " + profileError.message });
    }

    res.json({ success: true, user: { id: newUserId, name, email } });
  } catch (err) {
    console.error("[salesAdmin] create user error:", err);
    res.status(500).json({ error: err.message || "Failed to create user." });
  }
});

// POST /api/sales-admin/users/update
// Updates name/email for an existing Sales user. The auth login email is
// kept in sync with the profile email so edited users can still sign in.
router.post("/users/update", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const id = req.body?.id;
    const name = (req.body?.name || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();

    if (!id) return res.status(400).json({ error: "User id is required." });
    if (!name) return res.status(400).json({ error: "Name is required." });
    if (!isValidSalesEmail(email)) {
      return res.status(400).json({ error: `Email must be a valid @${SALES_EMAIL_DOMAIN} address.` });
    }

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      email_confirm: true,
    });
    if (authUpdateError) {
      const msg = /already been registered|already exists/i.test(authUpdateError.message || "")
        ? "A user with this email already exists."
        : authUpdateError.message;
      return res.status(400).json({ error: msg });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ name, email })
      .eq("id", id);

    if (profileError) throw profileError;

    res.json({ success: true });
  } catch (err) {
    console.error("[salesAdmin] update user error:", err);
    res.status(500).json({ error: err.message || "Failed to update user." });
  }
});

// POST /api/sales-admin/users/set-password
// Directly sets a new password via the Admin API so it works at the user's
// very next login — replaces the old resetPasswordForEmail() email flow.
router.post("/users/set-password", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const id = req.body?.id;
    const password = req.body?.password || "";

    if (!id) return res.status(400).json({ error: "User id is required." });
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("[salesAdmin] set password error:", err);
    res.status(500).json({ error: err.message || "Failed to set password." });
  }
});

// POST /api/sales-admin/users/deactivate
// Soft-deletes the profile (as before) AND locks the auth account itself via
// the Admin API, so a deactivated Sales user can't log in again at all.
router.post("/users/deactivate", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const id = req.body?.id;
    if (!id) return res.status(400).json({ error: "User id is required." });

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", id);
    if (profileError) throw profileError;

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: "876000h",
    });
    if (banError) {
      console.error("[salesAdmin] profile deactivated but auth lock failed:", banError);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[salesAdmin] deactivate user error:", err);
    res.status(500).json({ error: err.message || "Failed to deactivate user." });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/sales-admin/data-comparison/extract
// Used by the Data Comparison tab (Master Data vs GHL Lead Data auditing)
// to turn a messy, hand-typed sheet -- especially a PDF, where the old
// positional column reconstruction routinely misaligned data -- into
// clean, structured lead records via the Claude API. Body: { text,
// fileName }. Requires ANTHROPIC_API_KEY in server/.env; without it this
// returns 501 with a specific code rather than failing silently, so the
// frontend can tell the admin exactly what to set up.
// ─────────────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const EXTRACTION_SYSTEM_PROMPT = `You extract lead records from messy, hand-maintained sales sheets (CSV, Excel, or text pulled from a PDF export). Column headers and order vary between sheets, some rows are missing fields, and PDF-extracted text can have columns run together or split oddly.

Return ONLY a JSON array (no prose, no markdown fences, no explanation). Each element is one lead record with exactly these fields, using "" for anything not present in that row -- never guess or invent a value that isn't in the text:
{
  "name": "customer/contact name",
  "businessName": "business or opportunity name, if the sheet has one distinct from the customer name",
  "phone": "phone number as written",
  "email": "email address",
  "address": "street address",
  "comment": "any notes/comments/remarks",
  "status": "final status/outcome (Booked, Not Sold, Sold, Cancelled, etc.)",
  "stage": "pipeline stage, if distinct from status",
  "salesperson": "assigned salesperson name",
  "source": "how the lead heard about the business (Google, referral, social media, etc.)",
  "date": "the lead's date, in whatever format the sheet uses"
}

Skip rows that are clearly not individual leads -- sheet titles, column headers repeated mid-sheet, and totals/summary rows ("Total number of Leads", "Total number of Leads Converted", "Follow up", "Booked but Not Visited", "Need to Book", and similar). Do not skip a row just because it's thin (e.g. only a phone number) -- that is still a real lead and belongs in the output.`;

router.post("/data-comparison/extract", async (req, res) => {
  try {
    const { text, fileName } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text to extract from." });
    }
    if (!ANTHROPIC_API_KEY) {
      return res.status(501).json({
        error: "AI extraction isn't set up yet \u2014 add ANTHROPIC_API_KEY to server/.env to enable it.",
        code: "ANTHROPIC_NOT_CONFIGURED",
      });
    }

    // Keep the payload reasonable -- a long PDF/sheet gets truncated with a
    // flag back to the client rather than silently blowing the model's
    // context window or the bill.
    const MAX_CHARS = 60000;
    const truncated = text.length > MAX_CHARS;
    const clipped = truncated ? text.slice(0, MAX_CHARS) : text;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: ANTHROPIC_MODEL,
        max_tokens: 8000,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `File: ${fileName || "upload"}\n\n${clipped}` }],
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        timeout: 90000,
      }
    );

    const raw = response.data?.content?.[0]?.text || "";
    // Asked for JSON only, but strip code fences defensively in case the
    // model wraps it in ```json anyway.
    const jsonText = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

    let records;
    try {
      records = JSON.parse(jsonText);
    } catch {
      console.error("[salesAdmin] Claude extraction returned non-JSON:", raw.slice(0, 500));
      return res.status(502).json({ error: "AI extraction returned an unreadable response. Try again, or use the file's own columns instead." });
    }

    if (!Array.isArray(records)) {
      return res.status(502).json({ error: "AI extraction didn't return a list of records." });
    }

    res.json({ records, truncated });
  } catch (err) {
    const anthropicError = err.response?.data?.error?.message;
    console.error("[salesAdmin] Claude extraction failed:", anthropicError || err.message);
    res.status(500).json({ error: anthropicError || err.message || "AI extraction failed." });
  }
});

module.exports = router;
