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
Also extract:

1. Candidate Full Name
2. Total Years of Experience
3. Current Location
4. Best Recommended Job Role
5. Top 3 Suitable Job Roles

Evaluate the candidate based on:

1. Direct experience related to the role
2. Similar or transferable experience
3. Leadership and supervisory experience
4. Technical and practical skills
5. Education and certifications
6. Overall suitability for the position

Even if the candidate does not have direct experience in the role,
consider related experience and transferable skills.

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

The score should represent overall suitability.

Do not wrap JSON in markdown.
Do not use \`\`\`json.
Return raw JSON only.

Return ONLY valid JSON:

{
  "name": "",
  "experience": "",
  "location": "",
  "recommendedRole": "",
  "score": 0,
  "suitableJobs": [],
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

  let cleanedText = aiText
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

      let parsedResult;

      try {
        console.log("CLEANED TEXT START");
console.log(cleanedText);

       parsedResult = JSON.parse(cleanedText);

      } catch {

  parsedResult = {
  name: "",
  experience: "",
  location: "",
  recommendedRole: "",
  suitableJobs: [],
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
  suitableJobs:
  parsedResult.suitableJobs,


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