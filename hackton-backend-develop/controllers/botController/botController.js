const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

app.use(express.json());

exports.chatBot= async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
  
      const completion = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: message,
        max_tokens: 500,
      });
  
      const completionResponse = completion.choices[0].text;
      res.json({ response: completionResponse });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      res
        .status(500)
        .json({ error: "An error occurred while processing the message" });
    }
  };