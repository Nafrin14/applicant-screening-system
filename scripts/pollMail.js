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

// Reply emails carry the candidate's new text on top, followed by the
// full quoted original thread ("On <date>, X wrote: > ..."). Chat bubbles
// only want the new text — cut everything from the first quote-header
// line onward (Gmail "On ... wrote:", Outlook "----- Original Message
// -----", or classic "> " quoted lines).
function stripQuotedReply(text) {
  if (!text) return text;
  const lines = text.split(/\r?\n/);
  let cutIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^On\b.*wrote:\s*$/i.test(line)) {
      cutIndex = i;
      break;
    }
    if (/^On\b/.test(line)) {
      const lookahead = lines.slice(i, i + 3).join(" ");
      if (/\bwrote:/i.test(lookahead)) {
        cutIndex = i;
        break;
      }
    }
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(line)) {
      cutIndex = i;
      break;
    }
    if (/^>/.test(line)) {
      cutIndex = i;
      break;
    }
  }

  if (cutIndex === -1) return text.trim();
  return lines.slice(0, cutIndex).join("\n").trim();
}

// How far back to look on each poll (2 days covers restarts & gaps)
const SINCE_DAYS = 2;

// Loop interval — 60 seconds in production, override via env var
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 60_000;

const ONCE_MODE = process.argv.includes("--once");

// ─── core poll ───────────────────────────────────────────────────────────────

async function pollMail() {
  const { data: settingsRow } = await supabase
    .from("settings")
    .select("notify_mail_replies")
    .eq("id", 1)
    .maybeSingle();
  const notifyMailReplies = settingsRow?.notify_mail_replies ?? true;

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

        const { data: stored, error } = await supabase
          .from("email_replies")
          .upsert(
            [
              {
                message_id: messageId,
                candidate_id: candidateId,
                from_email: sender.address || "",
                from_name: sender.name || "",
                subject,
                body_text: stripQuotedReply(parsed.text || ""),
                received_at: (parsed.date || new Date()).toISOString(),
              },
            ],
            { onConflict: "message_id", ignoreDuplicates: true }
          )
          .select();

        if (error) {
          console.error(`Failed to store ${messageId}:`, error.message);
          continue;
        }

        // .select() returns [] (not an error) when ignoreDuplicates skipped
        // an existing row — only notify on a genuinely new message.
        if (!stored || stored.length === 0) {
          console.log(`Skipped duplicate: ${messageId}`);
          continue;
        }

        console.log(
          `Stored: ${sender.address || "unknown"} → candidate ${candidateId ?? "unmatched"}`
        );

        if (notifyMailReplies) {
          let notifyName = sender.name || sender.address || "Unknown sender";
          if (candidateId) {
            const { data: candidateRow } = await supabase
              .from("applicants")
              .select("name")
              .eq("id", candidateId)
              .maybeSingle();
            if (candidateRow?.name) notifyName = candidateRow.name;
          }

          const { error: notifyError } = await supabase.from("notifications").insert([
            {
              title: "New email reply",
              candidate_name: notifyName,
              is_read: false,
            },
          ]);
          if (notifyError) {
            console.error("Failed to create notification:", notifyError.message);
          }
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
    await updateSyncStatus();
  }
}

async function updateSyncStatus() {
  const { error } = await supabase
    .from("sync_status")
    .upsert([{ id: 1, last_synced_at: new Date().toISOString() }]);
  if (error) {
    console.error("Failed to update sync_status (table may not exist yet):", error.message);
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
