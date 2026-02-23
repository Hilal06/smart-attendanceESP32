
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Employee } from "../types";

export const generateAttendanceInsights = async (
  attendance: AttendanceRecord[],
  employees: Employee[]
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn("Gemini API Key is missing or invalid. Please set a valid VITE_GEMINI_API_KEY in your .env file.");
      return "<strong>AI insights unavailable.</strong><br/>Please configure your `VITE_GEMINI_API_KEY` in the `.env` file to activate this feature.";
    }

    // Initialize the official Google Gen AI SDK
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
      
      CRITICAL FORMATTING RULES:
      1. Format the response STRICTLY as valid HTML. Do not use Markdown (no **, #, or \`\`\`).
      2. Use <strong> for emphasis, <ul>/<li> for lists, and <p> for paragraphs.
      3. Do not wrap the response in HTML code blocks or any other wrappers.
      4. Keep it concise, professional, and directly address management.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights. Please check your network or API quota.";
  }
};

export const generateEmployeePerformanceSummary = async (
  employee: Employee,
  attendanceRecords: AttendanceRecord[]
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn("Gemini API Key is missing or invalid. Please set a valid VITE_GEMINI_API_KEY in your .env file.");
      return "<strong>AI insights unavailable.</strong><br/>Please configure your `VITE_GEMINI_API_KEY` in the `.env` file to activate this feature.";
    }

    // Initialize the official Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey });

    // Filter attendance for just this employee to ensure accurate data is sent
    const empRecords = attendanceRecords.filter(a => a.employeeId === employee.id);

    // Prepare a concise summary for the AI
    const dataSummary = {
      employeeName: employee.name,
      role: employee.role,
      department: employee.department,
      joinDate: employee.joinDate,
      totalRecords: empRecords.length,
      statusCounts: {
        present: empRecords.filter(a => a.status === 'Present').length,
        late: empRecords.filter(a => a.status === 'Late').length,
        absent: empRecords.filter(a => a.status === 'Absent').length,
      }
    };

    const prompt = `
      You are an HR Analytics Assistant. Analyze the following individual attendance summary for an employee named ${employee.name}.
      Write a brief, professional performance summary regarding their punctuality and attendance reliability.
      
      Focus on:
      1. Their overall attendance trend based on the ratio of Present, Late, and Absent days (if any data is available).
      2. 1 constructive suggestion or positive reinforcement for the employee based *only* on the data provided.
      3. Keep the tone encouraging but professional.

      Data: ${JSON.stringify(dataSummary)}
      
      CRITICAL FORMATTING RULES:
      1. Format the response STRICTLY as valid HTML. Do not use Markdown (no **, #, or \`\`\`).
      2. Use <strong> for emphasis and <p> for paragraphs.
      3. Do not wrap the response in HTML code blocks or any other wrappers.
      4. Keep it concise (1-2 very short paragraphs max).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate performance summary. Please check your network or API quota.";
  }
};
