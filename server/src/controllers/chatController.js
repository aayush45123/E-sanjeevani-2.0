import { OpenAI } from "openai";

export const handleChat = async (req, res) => {
  try {
    // Initialize client inside the controller
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN,
    });

    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const chatCompletion = await client.chat.completions.create({
      model: "Intelligent-Internet/II-Medical-8B:featherless-ai",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({ reply: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: "Failed to generate AI response. Please try again." });
  }
};