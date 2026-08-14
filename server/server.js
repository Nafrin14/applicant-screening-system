const express = require("express");
const cors = require("cors");
require("dotenv").config();


console.log(
  "API KEY =>",
  process.env.GROQ_API_KEY
);


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

app.use(
cors({

  origin:
  "http://localhost:5173",

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