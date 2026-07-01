const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const https = require("https");

console.log(
  "API KEY =>",
  process.env.ANTHROPIC_API_KEY
);
const aiScreeningRoutes =
  require("./routes/aiScreening");

  const indeedRoutes =
  require("./routes/indeedRoutes");

const app = express();

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
async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(
            new Error(`Download failed: ${response.statusCode}`)
          );
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
  });
}
app.post("/api/share-whatsapp", async (req, res) => {
  try {
    const { contactName, candidates } = req.body;

    if (!contactName || !candidates || candidates.length === 0) {
      return res.status(400).json({
        error: "contactName and candidates are required",
      });
    }

    const tempDir = path.join(__dirname, "..", "automation", "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const shareItems = [];

    for (const candidate of candidates) {
      if (!candidate.resume_url) continue;

      const safeName = candidate.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const pdfPath = path.join(
        tempDir,
        `${safeName}_${Date.now()}.pdf`
      );

      await downloadFile(candidate.resume_url, pdfPath);

      shareItems.push({
        message:
          `${candidate.rank}. ${candidate.name}\n` +
          `Contact: ${candidate.phone || "N/A"}\n` +
          `Job: ${candidate.role || "N/A"}`,
        pdfPath,
      });
    }

    const dataPath = path.join(tempDir, "share_data.json");

    fs.writeFileSync(
      dataPath,
      JSON.stringify({
        contactName,
        items: shareItems,
      })
    );

    const scriptPath = path.join(
      __dirname,
      "..",
      "automation",
      "send_whatsapp.py"
    );

    const python = spawn(
      "py",
      [scriptPath, dataPath],
      {
        cwd: path.join(__dirname, "..", "automation"),
      }
    );

    python.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    python.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    python.on("close", (code) => {
      console.log("Python exited:", code);
    });

    res.json({
      success: true,
      message: "WhatsApp automation started",
    });
  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      error: error.message,
    });
  }
});
const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});