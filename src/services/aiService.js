import axios from "axios";

const API =
  "http://localhost:5000/api/ai/screen";

export const screenResume = async (
  resumeText,
  jobRole
) => {
  try {

    const response =
      await axios.post(
        API,
        {
          resumeText,
          jobRole,
        }
      );

    return {
      success: true,
      score:
        response?.data?.score || 0,
      recommendation:
        response?.data?.recommendation || "",
      summary:
        response?.data?.summary || "",
      strengths:
        response?.data?.strengths || [],
      missingSkills:
        response?.data?.missingSkills || [],
      result:
        response?.data?.result ||
        "AI Analysis Completed",
    };

  } catch (error) {

    console.log(error);

    return {
      success: false,
      score: 0,
      recommendation: "",
      summary: "",
      strengths: [],
      missingSkills: [],
      result:
        "AI Screening Failed",
    };
  }
};