import { OpenAI } from "openai";

export const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    if (!process.env.HF_TOKEN) {
      console.error("HF_TOKEN environment variable is not set");
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please contact support.",
      });
    }

    // Initialize client inside the controller
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "Intelligent-Internet/II-Medical-8B:featherless-ai",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: {
        reply: chatCompletion.choices[0].message.content,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI response. Please try again.",
      error: error.message,
    });
  }
};
