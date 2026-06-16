const express = require("express");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

require("dotenv").config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

     const response = await axios.post(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    model: "llama-3.3-70b-versatile",

    messages: [
      {
        role: "user",
        content: `
Analyze this resume for the role: ${jobRole}

Resume:
${resumeText}

You are an expert HR recruiter.

Return ONLY valid JSON:

{
  "name": "",
  "experience": "",
  "location": "",
  "recommendedRole": "",
  "score": 0,
  "recommendation": "",
  "summary": "",
  "strengths": [],
  "missingSkills": [],
  "whySuitable": ""
}
`
      }
    ],

    temperature: 0.3
  },
  {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    }
  }
);

const aiText =
  response.data.choices[0].message.content;

      let parsedResult;

      try {

        parsedResult = JSON.parse(aiText);

      } catch {

  parsedResult = {
  name: "",
  experience: "",
  location: "",
  recommendedRole: "",
  score: 50,
  recommendation: "Moderate Match",
  summary: aiText,
  strengths: [],
  missingSkills: [],
  whySuitable: "",
};
      }

      res.json({
        success: true,

   name: parsedResult.name,
  experience: parsedResult.experience,
  location: parsedResult.location,
  recommendedRole: parsedResult.recommendedRole,


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
  "Groq AI Screening Failed",
      });
    }
  }
);

module.exports = router;