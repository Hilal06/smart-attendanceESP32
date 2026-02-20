
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Employee } from "../types";

export const generateAttendanceInsights = async (
  attendance: AttendanceRecord[],
  employees: Employee[]
): Promise<string> => {
  try {
    // Initializing the AI client with the API key from environment variables as per requirements.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
      return "AI insights unavailable. Administrative configuration required.";
    }
    const ai = new GoogleGenAI({ apiKey });

    // Prepare data summary for the AI to consume less tokens but get better context
    const dataSummary = {
      totalRecords: attendance.length,
      employees: employees.map(e => ({ id: e.id, name: e.name, role: e.role })),
      recordsSample: attendance.slice(0, 50), // Send a sample to avoid token limits in this demo
      summaryStats: {
        late: attendance.filter(a => a.status === 'Late').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
      }
    };

    const prompt = `
      You are an HR Analytics Assistant. Analyze the following attendance data summary and provide 3 key insights 
      and 1 actionable recommendation for management.
      
      Focus on:
      1. Attendance trends (lateness, absence).
      2. Specific employee patterns if noticeable.
      3. Operational efficiency based on check-in times.

      Data: ${JSON.stringify(dataSummary)}
      
      Format the response as HTML with simple formatting (e.g., <strong>, <ul>, <li>).
      Keep it concise and professional.
    `;

    // Calling the model with the correct configuration and model name for text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly accessing the .text property to get the generated output.
    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights. Please check your network or API quota.";
  }
};
