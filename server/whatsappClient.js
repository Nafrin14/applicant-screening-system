const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

class WhatsAppAutomationError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "WhatsAppAutomationError";
    this.code = options.code || "WHATSAPP_AUTOMATION_FAILED";
    this.statusCode = options.statusCode || 500;
    this.cause = options.cause;
  }
}

const projectRoot = path.resolve(__dirname, "..");
const automationDir = path.join(projectRoot, "automation");
const pythonScriptPath = path.join(automationDir, "send_whatsapp.py");
const sessionDir = path.resolve(
  process.env.WHATSAPP_AUTH_DIR ||
    path.join(os.homedir(), ".applicant-screening-system", "whatsapp")
);
const tempDir = path.resolve(
  process.env.WHATSAPP_TEMP_DIR ||
    path.join(os.tmpdir(), "applicant-screening-system", "whatsapp")
);

let webClient;
let webClientReady = false;
let webClientInitPromise = null;
let whatsappWebJs;
let qrcodeTerminal;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getMode() {
  return String(process.env.WHATSAPP_MODE || "auto").trim().toLowerCase();
}

function getPythonCommand() {
  if (process.env.WHATSAPP_PYTHON) {
    return process.env.WHATSAPP_PYTHON;
  }

  return process.platform === "win32" ? "py" : "python3";
}

function loadWebDependencies() {
  if (whatsappWebJs && qrcodeTerminal) {
    return;
  }

  try {
    whatsappWebJs = require("whatsapp-web.js");
    qrcodeTerminal = require("qrcode-terminal");
  } catch (error) {
    throw new WhatsAppAutomationError(
      "WhatsApp Web support is unavailable because the server dependencies are missing. Install the server packages and retry, or use WHATSAPP_MODE=desktop on Windows.",
      {
        statusCode: 503,
        code: "WHATSAPP_WEB_UNAVAILABLE",
        cause: error,
      }
    );
  }
}

function getBrowserOptions() {
  return {
    headless: process.env.WHATSAPP_HEADLESS === "false" ? false : true,
    executablePath:
      process.env.WHATSAPP_BROWSER_PATH ||
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
}

function initializeWebClient() {
  if (webClientInitPromise) {
    return webClientInitPromise;
  }

  loadWebDependencies();
  const { Client, LocalAuth } = whatsappWebJs;

  ensureDir(sessionDir);

  webClient = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionDir }),
    puppeteer: getBrowserOptions(),
  });

  webClient.on("qr", (qr) => {
    console.log("Scan this QR code with WhatsApp Linked Devices:");
    qrcodeTerminal.generate(qr, { small: true });
    console.log(
      "If you need a visible browser window, set WHATSAPP_HEADLESS=false."
    );
  });

  webClient.on("ready", () => {
    webClientReady = true;
    console.log(`WhatsApp Web client is ready. Session cache: ${sessionDir}`);
  });

  webClient.on("disconnected", (reason) => {
    webClientReady = false;
    console.log("WhatsApp Web client disconnected:", reason);
  });

  webClient.on("auth_failure", (message) => {
    webClientReady = false;
    console.error("WhatsApp Web authentication failed:", message);
  });

  webClientInitPromise = webClient.initialize().catch((error) => {
    webClientReady = false;
    throw new WhatsAppAutomationError(
      "WhatsApp Web initialization failed. Check that a compatible browser is installed and that the linked WhatsApp account still allows web access.",
      {
        statusCode: 503,
        code: "WHATSAPP_WEB_INIT_FAILED",
        cause: error,
      }
    );
  });

  return webClientInitPromise;
}

async function ensureWebClientReady() {
  initializeWebClient();

  if (!webClientReady) {
    throw new WhatsAppAutomationError(
      `WhatsApp Web is not ready yet. Scan the QR code in the server terminal and retry. Session cache: ${sessionDir}`,
      {
        statusCode: 503,
        code: "WHATSAPP_WEB_NOT_READY",
      }
    );
  }

  return webClient;
}

async function downloadFile(url, destination) {
  ensureDir(path.dirname(destination));

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        request.destroy();
        file.close(() => {});
        fs.unlink(destination, () => {});
        reject(
          new WhatsAppAutomationError(
            `Download failed with HTTP ${response.statusCode} for ${url}`,
            {
              statusCode: 502,
              code: "WHATSAPP_RESUME_DOWNLOAD_FAILED",
            }
          )
        );
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    });

    request.on("error", (error) => {
      file.close(() => {});
      fs.unlink(destination, () => {});
      reject(
        new WhatsAppAutomationError(
          `Failed to download resume from ${url}. Check the URL and network access.`,
          {
            statusCode: 502,
            code: "WHATSAPP_RESUME_DOWNLOAD_FAILED",
            cause: error,
          }
        )
      );
    });
  });
}

async function buildShareItems(candidates) {
  ensureDir(tempDir);

  const items = [];

  for (const candidate of candidates) {
    if (!candidate.resume_url) {
      continue;
    }

    const safeName = String(candidate.name || "candidate")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    const pdfPath = path.join(tempDir, `${safeName}_${Date.now()}.pdf`);
    await downloadFile(candidate.resume_url, pdfPath);

    items.push({
      pdfPath,
      message:
        `${candidate.rank}. ${candidate.name}\n` +
        `Contact: ${candidate.phone || "N/A"}\n` +
        `Job: ${candidate.role || "N/A"}`,
    });
  }

  if (items.length === 0) {
    throw new WhatsAppAutomationError(
      "No candidates with resume URLs were supplied. Add at least one resume_url before sending to WhatsApp.",
      {
        statusCode: 400,
        code: "WHATSAPP_NO_ATTACHMENTS",
      }
    );
  }

  const dataPath = path.join(tempDir, "share_data.json");
  fs.writeFileSync(dataPath, JSON.stringify({ items }, null, 2));

  return { dataPath, items };
}

async function sendShareViaWeb(contactName, items) {
  const client = await ensureWebClientReady();
  const { MessageMedia } = whatsappWebJs;
  const chats = await client.getChats();
  const chat = chats.find(
    (item) => item.name?.toLowerCase() === String(contactName).toLowerCase()
  );

  if (!chat) {
    throw new WhatsAppAutomationError(
      `No WhatsApp chat found matching "${contactName}". Open WhatsApp Web and confirm the exact group or contact name.`,
      {
        statusCode: 404,
        code: "WHATSAPP_CHAT_NOT_FOUND",
      }
    );
  }

  const sentMessages = [];
  for (const item of items) {
    const media = MessageMedia.fromFilePath(item.pdfPath);
    const sentMessage = await client.sendMessage(chat.id._serialized, media, {
      caption: item.message,
    });

    sentMessages.push({
      filePath: item.pdfPath,
      messageId: sentMessage.id?._serialized || null,
    });
  }

  return {
    mode: "web",
    chatName: chat.name,
    sentMessages,
    sessionDir,
  };
}

async function sendShareViaDesktop(contactName, dataPath) {
  if (process.platform !== "win32") {
    throw new WhatsAppAutomationError(
      "Native WhatsApp desktop automation is only supported on Windows because it depends on Windows UI automation libraries. Use WhatsApp Web mode on macOS or Linux.",
      {
        statusCode: 501,
        code: "WHATSAPP_DESKTOP_UNSUPPORTED",
      }
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(getPythonCommand(), [pythonScriptPath, dataPath], {
      cwd: automationDir,
      env: {
        ...process.env,
        WHATSAPP_IMAGE_DIR: path.join(automationDir, "images"),
        WHATSAPP_CONTACT_NAME: contactName,
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    child.on("error", (error) => {
      reject(
        new WhatsAppAutomationError(
          `Failed to start the Windows desktop automation script using ${getPythonCommand()}. Install Python and the Windows automation packages, or switch to WhatsApp Web mode.`,
          {
            statusCode: 503,
            code: "WHATSAPP_DESKTOP_START_FAILED",
            cause: error,
          }
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new WhatsAppAutomationError(
            `Windows desktop automation exited with code ${code}. ${stderr || stdout || "Check that the WhatsApp desktop app is open."}`,
            {
              statusCode: 500,
              code: "WHATSAPP_DESKTOP_FAILED",
            }
          )
        );
        return;
      }

      resolve({
        mode: "desktop",
        contactName,
        sessionDir,
      });
    });
  });
}

async function sendWhatsAppShare({ contactName, candidates }) {
  if (!contactName || !Array.isArray(candidates) || candidates.length === 0) {
    throw new WhatsAppAutomationError(
      "contactName and at least one candidate are required to send a WhatsApp share.",
      {
        statusCode: 400,
        code: "WHATSAPP_INVALID_PAYLOAD",
      }
    );
  }

  const mode = getMode();
  const { dataPath, items } = await buildShareItems(candidates);

  if (mode === "desktop") {
    return sendShareViaDesktop(contactName, dataPath);
  }

  if (mode === "web") {
    return sendShareViaWeb(contactName, items);
  }

  if (mode !== "auto") {
    throw new WhatsAppAutomationError(
      `Unsupported WHATSAPP_MODE value "${mode}". Use web, desktop, or auto.`,
      {
        statusCode: 400,
        code: "WHATSAPP_INVALID_MODE",
      }
    );
  }

  try {
    return await sendShareViaWeb(contactName, items);
  } catch (error) {
    if (process.platform === "win32") {
      console.warn(
        "WhatsApp Web mode failed, falling back to Windows desktop automation.",
        error.message
      );
      return sendShareViaDesktop(contactName, dataPath);
    }

    throw error;
  }
}

function getWhatsAppRuntimeInfo() {
  return {
    mode: getMode(),
    sessionDir,
    tempDir,
    platform: process.platform,
    webReady: webClientReady,
  };
}

module.exports = {
  WhatsAppAutomationError,
  sendWhatsAppShare,
  getWhatsAppRuntimeInfo,
};