// Connects to the recruiting mailbox over IMAP, pulls recent messages, and
// stores each one in Supabase's email_replies table.
//
// Two run modes:
//   node pollMail.js          → loop mode: polls every POLL_INTERVAL_MS (default 60s)
//   node pollMail.js --once   → single run: used by GitHub Actions cron (kept as fallback)
//
// Candidates are matched via the "[Ref: id]" tag every bulk email's subject
// carries (see withCandidateRefTag in src/.../BulkActions.jsx).

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createClient } from "@supabase/supabase-js";

const {
  IMAP_HOST,
  IMAP_PORT,
  IMAP_USER,
  IMAP_PASSWORD,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const required = {
  IMAP_HOST,
  IMAP_PORT,
  IMAP_USER,
  IMAP_PASSWORD,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
};
const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const REF_TAG_RE = /\[Ref:\s*(\d+)\]/i;

// How far back to look on each poll (2 days covers restarts & gaps)
const SINCE_DAYS = 2;

// Loop interval — 60 seconds in production, override via env var
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 60_000;

const ONCE_MODE = process.argv.includes("--once");

// ─── core poll ───────────────────────────────────────────────────────────────

async function pollMail() {
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: Number(IMAP_PORT),
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASSWORD },
    logger: false,
  });

  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date();
      since.setDate(since.getDate() - SINCE_DAYS);
      const uids = await client.search({ since });

      if (!uids || uids.length === 0) {
        console.log(`[${new Date().toISOString()}] No recent messages.`);
        return;
      }

      console.log(`[${new Date().toISOString()}] Found ${uids.length} message(s).`);

      for (const uid of uids) {
        const message = await client.fetchOne(uid, { source: true });
        if (!message?.source) continue;

        const parsed = await simpleParser(message.source);
        const messageId = parsed.messageId || `${IMAP_USER}-uid${uid}`;
        const subject = parsed.subject || "";
        const refMatch = subject.match(REF_TAG_RE);
        const candidateId = refMatch ? Number(refMatch[1]) : null;
        const sender = parsed.from?.value?.[0] || {};

        const { error } = await supabase.from("email_replies").upsert(
          [
            {
              message_id: messageId,
              candidate_id: candidateId,
              from_email: sender.address || "",
              from_name: sender.name || "",
              subject,
              body_text: parsed.text || "",
              received_at: (parsed.date || new Date()).toISOString(),
            },
          ],
          { onConflict: "message_id", ignoreDuplicates: true }
        );

        if (error) {
          console.error(`Failed to store ${messageId}:`, error.message);
        } else {
          console.log(
            `Stored: ${sender.address || "unknown"} → candidate ${candidateId ?? "unmatched"}`
          );
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

// ─── run modes ───────────────────────────────────────────────────────────────

if (ONCE_MODE) {
  // GitHub Actions: run once and exit
  pollMail()
    .then(() => { console.log("Poll complete."); process.exit(0); })
    .catch((err) => { console.error("Poll failed:", err); process.exit(1); });
} else {
  // Railway / continuous: loop forever
  console.log(`Mail poller starting — interval ${POLL_INTERVAL_MS / 1000}s`);

  const runLoop = async () => {
    try {
      await pollMail();
    } catch (err) {
      // Log but don't crash — next iteration will retry
      console.error(`[${new Date().toISOString()}] Poll error:`, err.message);
    }
    setTimeout(runLoop, POLL_INTERVAL_MS);
  };

  runLoop();
}
