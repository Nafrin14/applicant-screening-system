require("dotenv").config();

async function test() {
  try {
    console.log(
      "KEY FOUND =",
      !!process.env.GROQ_API_KEY
    );

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: "Say hello"
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("\nRESULT:");
    console.log(data);

  } catch (error) {
    console.error(error);
  }
}

test();