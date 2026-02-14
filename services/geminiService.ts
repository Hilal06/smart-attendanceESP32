import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Employee } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateAttendanceInsights = async (
  attendance: AttendanceRecord[],
  employees: Employee[]
): Promise<string> => {
  if (!API_KEY) {
    return "API Key is missing. Please configure your API key in the environment or settings.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights. Please check your network or API quota.";
  }
};