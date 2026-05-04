import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());

function imageToBase64(file) {
  return file.buffer.toString("base64");
}

app.post("/api/analyze-meal", upload.single("photo"), async (req, res) => {
  try {
    const text = req.body.text || "";
    let imagePart = null;

    if (req.file) {
      const base64 = imageToBase64(req.file);
      imagePart = {
        type: "input_image",
        image_url: `data:${req.file.mimetype};base64,${base64}`
      };
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyseer deze maaltijd en geef JSON met: meal, calories, protein, confidence. Extra info: ${text}`
            },
            ...(imagePart ? [imagePart] : [])
          ]
        }
      ]
    });

    const output = response.output_text.trim();
    const clean = output.replace(/```json|```/g, "");
    const data = JSON.parse(clean);

    res.json(data);

  } catch (error) {
    res.status(500).json({
      error: "AI fout",
      message: error.message
    });
  }
});

app.listen(3000, () => {
  console.log("Backend draait op http://localhost:3000");
});
