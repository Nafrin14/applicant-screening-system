import axios from "axios";

const API =
  "http://localhost:5000/api/ai/screen";

export const screenResume =
  async (
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
        result:
          response?.data?.result ||
          response?.data?.message ||
          "AI Analysis Completed",
      };

    } catch (error) {

      console.log(error);

      return {
        success: false,
        result:
          "AI Screening Failed",
      };
    }
  };