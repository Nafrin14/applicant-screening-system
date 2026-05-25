const express = require("express");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

require("dotenv").config();

const router =
  express.Router();

async function extractResumeText(
  filePath
) {

  const fileExtension =
    filePath
      .split(".")
      .pop();

  if (
    fileExtension ===
    "pdf"
  ) {

    const dataBuffer =
      fs.readFileSync(
        filePath
      );

    const pdfData =
      await pdfParse(
        dataBuffer
      );

    return pdfData.text;
  }

  if (
    fileExtension ===
      "docx" ||
    fileExtension ===
      "doc"
  ) {

    const result =
      await mammoth.extractRawText(
        {
          path: filePath,
        }
      );

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

            max_tokens:
              1200,

            messages: [
              {
                role:
                  "user",

                content: `

Analyze this resume for the role: ${jobRole}

Resume:
${resumeText}

Give detailed analysis with:

1. Candidate Summary
2. Education
3. Skills
4. Projects
5. Experience
6. Match Score out of 100
7. Final Recommendation

Use all important details from the resume.

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

      res.json({
        success: true,

        result:
          response.data
            .content[0]
            .text,
      });

    } catch (error) {

      console.log(
        error.response
          ?.data ||
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

module.exports =
  router;