const express = require("express");
const cors = require("cors");
require("dotenv").config();

const aiScreeningRoutes =
  require("./routes/aiScreening");

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

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});