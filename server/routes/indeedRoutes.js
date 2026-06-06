const express = require("express");
const axios = require("axios");

const router =
  express.Router();

router.get(
  "/test",
  async (req, res) => {


    res.json({
      success: true,
      message:
        "Indeed route working",

    });
  }
);


router.get(
  "/auth-url",
  async (req, res) => {

    try {

      const clientId =
        process.env
          .INDEED_CLIENT_ID;

      const redirectUri =
        "http://localhost:5000/api/indeed/callback";

      const authUrl =
        `https://secure.indeed.com/oauth/v2/authorize?client_id=${clientId}
        &response_type=code&redirect_uri=${redirectUri}&scope=employer_access`;

      res.json({
        success: true,
        authUrl,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to generate Indeed auth URL",
      });
    }
  }
);

router.post(
  "/post-job",
  async (req, res) => {

    try {

      const job =
        req.body;

      console.log(
        "Received Job:",
        job
      );

      // Future Indeed API posting here

      res.status(200).json({
        success: true,
        message:
          "Job received successfully",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to post job",
      });
    }
  }
);

router.get(
  "/callback",
  async (req, res) => {

    try {

      const code =
        req.query.code;

      if (!code) {

        return res.status(400).json({
          success: false,
          message:
            "Authorization code missing",
        });
      }

      res.json({
        success: true,
        message:
          "Indeed OAuth callback received",
        code,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "OAuth callback failed",
      });
    }
  }
);

module.exports =
  router;