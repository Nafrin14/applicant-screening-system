const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log(
  "GROQ KEY LOADED =>",
  GROQ_API_KEY ? "YES" : "NO"
);


router.post("/screen", async (req, res) => {

  try {

    const {
      resumeText,
      jobRole
    } = req.body;


    console.log("AI SCREEN REQUEST RECEIVED");

    console.log(
      "Job Role:",
      jobRole
    );

    console.log(
      "Resume Length:",
      resumeText?.length
    );


    if (!resumeText) {

      return res.status(400).json({

        success:false,

        message:
        "Resume text required"

      });

    }


    if (!GROQ_API_KEY) {

      return res.status(500).json({

        success:false,

        message:
        "Groq API key missing"

      });

    }



    const response = await axios.post(

      "https://api.groq.com/openai/v1/chat/completions",


      {

        model:
        "llama-3.1-8b-instant",


        messages:[

          {

            role:"user",

            content:`

Analyze this resume for the job role: ${jobRole}


Resume:

${resumeText}


You are an expert HR recruiter.


Return ONLY valid JSON.

No markdown.
No code blocks.


JSON format:

{
"name":"",
"experience":"",
"location":"",
"recommendedRole":"",
"score":0,
"recommendation":"",
"summary":"",
"strengths":[],
"missingSkills":[],
"whySuitable":""
}

`

          }

        ],


        temperature:0.3


      },


      {

        headers:{

          Authorization:
          `Bearer ${GROQ_API_KEY}`,


          "Content-Type":
          "application/json"

        }

      }

    );



    console.log(
      "GROQ RESPONSE RECEIVED"
    );



    const aiText =
    response.data.choices[0].message.content;



    console.log(
      "AI RESPONSE:"
    );


    console.log(aiText);



    let cleanedText =
    aiText
    .replace(/```json/g,"")
    .replace(/```/g,"")
    .trim();



    let result;



    try {


      result =
      JSON.parse(cleanedText);


    }

    catch(error){


      console.log(
        "JSON PARSE ERROR:",
        error.message
      );


      result={

        name:"",

        experience:"",

        location:"",

        recommendedRole:"",

        score:50,

        recommendation:
        "Moderate Match",

        summary:
        aiText,

        strengths:[],

        missingSkills:[],

        whySuitable:""

      };


    }



    res.json({

      success:true,


      name:
      result.name || "",


      experience:
      result.experience || "",


      location:
      result.location || "",


      recommendedRole:
      result.recommendedRole || "",


      score:
      result.score || 0,


      recommendation:
      result.recommendation || "",


      summary:
      result.summary || "",


      strengths:
      result.strengths || [],


      missingSkills:
      result.missingSkills || [],


      whySuitable:
      result.whySuitable || "",


      result:
      aiText

    });



  }


  catch(error){


    console.log(
      "========== GROQ ERROR =========="
    );


    console.log(
      "MESSAGE:",
      error.message
    );


    console.log(
      "RESPONSE:",
      error.response?.data
    );


    console.log(
      "STATUS:",
      error.response?.status
    );



    res.status(500).json({

      success:false,


      message:
      "Groq AI Screening Failed",


      error:
      error.response?.data ||
      error.message

    });


  }


});


module.exports = router;