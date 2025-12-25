
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const extractBannerText = async (base64Image: string, mimeType: string) => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: `Analyze this banner and extract:
            1. The 'promotionName': This is the main text with the highest visual prominence (the campaign theme).
            2. The 'textElement': This is the text found on a button or Call-to-Action (CTA).
            
            Return the result in JSON format.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          promotionName: {
            type: Type.STRING,
            description: "O texto principal com maior destaque visual na imagem."
          },
          textElement: {
            type: Type.STRING,
            description: "O texto localizado sobre uma forma de botão ou CTA."
          }
        },
        required: ["promotionName", "textElement"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (e) {
    console.error("Erro ao parsear resposta do Gemini", e);
    return { promotionName: '', textElement: '' };
  }
};
