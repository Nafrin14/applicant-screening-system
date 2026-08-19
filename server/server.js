const express = require("express");
const cors = require("cors");
require("dotenv").config();


const aiScreeningRoutes =
require("./routes/aiScreening");


const app = express();


// Test API

app.get("/", (req, res) => {

  res.send(
    "Backend is running"
  );

});



// Logger

app.use((req,res,next)=>{

  console.log(
    req.method,
    req.url
  );

  next();

});



// CORS
// ALLOWED_ORIGINS = comma-separated list of frontend URLs allowed to call
// this API (e.g. "https://your-app.vercel.app,https://your-app-*.vercel.app").
// Falls back to localhost so local dev keeps working without extra setup.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
cors({

  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },

  methods:[
    "GET",
    "POST"
  ],

  credentials:true

})
);



// Body parser

app.use(
express.json({
  limit:"20mb"
})
);


app.use(
express.urlencoded({

  limit:"20mb",

  extended:true

})
);



// Routes

app.use(
"/api/ai",
aiScreeningRoutes
);


// Server Start


const PORT =
process.env.PORT || 5000;



app.listen(

PORT,

"0.0.0.0",

()=>{


console.log(
`Server running on port ${PORT}`
);


}

);




// Error Handling


process.on(
"uncaughtException",
(err)=>{

console.log(
"UNCAUGHT ERROR:"
);

console.log(err);

}
);



process.on(
"unhandledRejection",
(err)=>{

console.log(
"UNHANDLED ERROR:"
);

console.log(err);

}
);