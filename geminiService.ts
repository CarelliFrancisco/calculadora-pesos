
import { GoogleGenAI, Type } from "@google/genai";
import { BoxQuantities, LoadingAdvice, BoxType } from "./types";

// Initialize Gemini client directly using process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Gets safety advice for vehicle loading using Gemini AI.
 * Receives allBoxTypes to accurately summarize custom user-defined boxes.
 */
export async function getLoadingAdvice(
  allBoxTypes: BoxType[],
  quantities: BoxQuantities,
  totalWeight: number,
  maxCapacity: number
): Promise<LoadingAdvice> {
  // Build a summary of the current load
  const boxSummary = allBoxTypes
    .filter(b => (quantities[b.id] || 0) > 0)
    .map(b => `${quantities[b.id]}x ${b.name} (${b.weight}kg)`)
    .join(', ');
  
  const prompt = `
    Soy el conductor de una camioneta con una capacidad máxima de ${maxCapacity}kg.
    Actualmente llevo: ${boxSummary || 'Ninguna carga'}.
    El peso total es: ${totalWeight}kg.
    La carga representa el ${((totalWeight / maxCapacity) * 100).toFixed(1)}% de la capacidad.
    
    Analiza esta situación y dame consejos de seguridad para conducir y estibar la carga.
    Responde en formato JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              enum: ['safe', 'warning', 'danger'],
              description: 'safe si < 70%, warning si 70-95%, danger si > 95%'
            },
            message: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ['status', 'message', 'tips']
        }
      }
    });

    // Directly access the .text property from GenerateContentResponse
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback advice if the API fails
    return {
      status: totalWeight > maxCapacity ? 'danger' : 'safe',
      message: "Análisis básico de carga realizado.",
      tips: [
        "Distribuye el peso uniformemente sobre el eje trasero.",
        "Asegura las cajas con correas para evitar desplazamientos.",
        "Aumenta la distancia de frenado con carga pesada."
      ]
    };
  }
}
