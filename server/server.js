const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log(
  "API KEY =>",
  process.env.ANTHROPIC_API_KEY
);
const aiScreeningRoutes =
  require("./routes/aiScreening");

  const indeedRoutes =
  require("./routes/indeedRoutes");
const {
  sendWhatsAppShare,
  WhatsAppAutomationError,
  getWhatsAppRuntimeInfo,
} = require("./whatsappClient");

const app = express();
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use(cors());

// Increase payload limit
app.use(express.json({
  limit: "20mb"
}));

app.use(express.urlencoded({
  limit: "20mb",
  extended: true
}));

app.use(
  "/api/ai",
  aiScreeningRoutes
);

app.use(
  "/api/indeed",
  indeedRoutes
);
app.post("/api/share-whatsapp", async (req, res) => {
  try {
    const result = await sendWhatsAppShare(req.body || {});

    res.json({
      success: true,
      message:
        result.mode === "web"
          ? "WhatsApp Web share completed"
          : "WhatsApp desktop share completed",
      runtime: getWhatsAppRuntimeInfo(),
      result,
    });
  } catch (error) {
    const statusCode = error instanceof WhatsAppAutomationError
      ? error.statusCode || 500
      : 500;

    console.error("WhatsApp share failed:", error);

    res.status(statusCode).json({
      error: error.message || "WhatsApp automation failed",
      code: error.code || "WHATSAPP_AUTOMATION_FAILED",
      runtime: getWhatsAppRuntimeInfo(),
      suggestion:
        process.platform === "win32"
          ? "Use WHATSAPP_MODE=web for browser automation or open WhatsApp Desktop on Windows before retrying."
          : "Use WHATSAPP_MODE=web and ensure a Chromium-compatible browser is installed. On Linux, verify sandbox/no-sandbox requirements in your environment.",
    });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});