// Run on a schedule by .github/workflows/imap-poll.yml — connects to the
// recruiting mailbox over IMAP, pulls unseen messages, and stores each one
// in Supabase's email_replies table. Candidates are matched via the
// "[Ref: id]" tag every bulk email's subject already carries
// (see withCandidateRefTag in src/.../BulkActions.jsx) — there's no other
// reliable link back to a candidate since EmailJS never hands us the real
// SMTP Message-ID to thread on.
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createClient } from "@supabase/supabase-js";

const {
  IMAP_HOST,
  IMAP_PORT,
  IMAP_USER,
  IMAP_PASSWORD,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = process.env;

const required = {
  IMAP_HOST,
  IMAP_PORT,
  IMAP_USER,
  IMAP_PASSWORD,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};
const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const REF_TAG_RE = /\[Ref:\s*(\d+)\]/i;

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
      const uids = await client.search({ seen: false });
      if (!uids || uids.length === 0) {
        console.log("No unseen messages.");
        return;
      }

      console.log(`Found ${uids.length} unseen message(s).`);

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
          console.error(`Failed to store message ${messageId}:`, error.message);
        } else {
          console.log(
            `Stored reply from ${sender.address || "unknown"} (candidate ${
              candidateId ?? "unmatched"
            })`
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

pollMail()
  .then(() => {
    console.log("Poll complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Poll failed:", err);
    process.exit(1);
  });
