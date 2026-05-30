const express = require("express");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

require("dotenv").config();

const router = express.Router();

async function extractResumeText(filePath) {

  const fileExtension =
    filePath.split(".").pop();

  if (fileExtension === "pdf") {

    const dataBuffer =
      fs.readFileSync(filePath);

    const pdfData =
      await pdfParse(dataBuffer);

    return pdfData.text;
  }

  if (
    fileExtension === "docx" ||
    fileExtension === "doc"
  ) {

    const result =
      await mammoth.extractRawText({
        path: filePath,
      });

    return result.value;
  }

  return "";
}

router.post(
  "/screen",
  async (req, res) => {

    try {

      const {
        resumeText,
        jobRole,
      } = req.body;

      const response =
        await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model:
              "claude-opus-4-7",

            max_tokens: 1200,

            messages: [
              {
                role: "user",

                content: `
Analyze this resume for the role: ${jobRole}

Resume:
${resumeText}

You are an expert HR recruiter.

Evaluate the candidate based on:

1. Direct experience related to the role
2. Similar or transferable experience
3. Leadership and supervisory experience
4. Technical and practical skills
5. Education and certifications
6. Overall suitability for the position

Even if the candidate does not have direct experience in the role, consider related experience and transferable skills.

Return ONLY valid JSON.

{
  "score": 0,
  "recommendation": "",
  "summary": "",
  "strengths": [],
  "missingSkills": [],
  "whySuitable": ""
}

Scoring Rules:

90-100 = Best Match
75-89 = Strong Match
60-74 = Moderate Match
Below 60 = Weak Match

Recommendation Rules:

- Best Match
- Strong Match
- Moderate Match
- Weak Match

The score should represent how suitable the candidate is for the role overall.

Do not focus only on exact skill matches.

Consider:
- Similar industries
- Related experience
- Leadership ability
- Supervisory responsibilities
- Transferable skills

Do not return markdown.
Do not return explanations outside JSON.
`,
              },
            ],
          },
          {
            headers: {
              "x-api-key":
                process.env
                  .ANTHROPIC_API_KEY,

              "anthropic-version":
                "2023-06-01",

              "content-type":
                "application/json",
            },
          }
        );

      const aiText =
        response.data.content[0].text;

      let parsedResult;

      try {

        parsedResult =
          JSON.parse(aiText);

      } catch {

        parsedResult = {
          score: 50,
          recommendation:
            "Moderate Match",
          summary: aiText,
          strengths: [],
          missingSkills: [],
          whySuitable: "",
        };
      }

      res.json({
        success: true,

        score:
          parsedResult.score,

        recommendation:
          parsedResult.recommendation,

        summary:
          parsedResult.summary,

        strengths:
          parsedResult.strengths,

        missingSkills:
          parsedResult.missingSkills,

        whySuitable:
          parsedResult.whySuitable,

        result: aiText,
      });

    } catch (error) {

      console.log(
        error.response?.data ||
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Claude AI Screening Failed",
      });
    }
  }
);

module.exports = router;