
import { GoogleGenAI } from "@google/genai";
import { Booking } from "../types";

export const getDailySummary = async (bookings: Booking[]) => {
  // Always use process.env.API_KEY directly when initializing GoogleGenAI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const bookingList = bookings
    .map(b => `- ${b.time}: ${b.customerName} (${b.service.name})`)
    .join('\n');

  const prompt = `
    Sei l'assistente virtuale di una barberia. Ecco gli appuntamenti di oggi:
    ${bookingList}

    Fornisci un riassunto brevissimo (massimo 2 frasi) per il barbiere: quanti clienti ci sono, 
    qual è l'orario più affollato e un augurio di buon lavoro.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // The text property directly returns the string output (do not use text() method).
    return response.text;
  } catch (error) {
    console.error("Error fetching AI summary:", error);
    return "Oggi è una giornata produttiva! Buon lavoro.";
  }
};
