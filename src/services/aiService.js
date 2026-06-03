import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${API_BASE}/api/ai/screen`;

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

      whySuitable:
        response?.data?.whySuitable || "",

      name:
        response?.data?.name || "",

      experience:
        response?.data?.experience || "",

      location:
        response?.data?.location || "",

      recommendedRole:
        response?.data?.recommendedRole || "",

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

      whySuitable: "",

      name: "",

      experience: "",

      location: "",

      recommendedRole: "",

      result:
        "AI Screening Failed",
    };
  }
};