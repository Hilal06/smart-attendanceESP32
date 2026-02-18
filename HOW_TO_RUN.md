# How to Run SmartAttend Locally

This guide will help you set up and run the SmartAttend project on your local machine.

## Prerequisites

- **Node.js**: You need Node.js installed. (You currently have v20.10.0, which is perfect for this project).
- **Git**: To clone/manage the repository (already installed).

## Quick Start

1. **Open a Terminal** in the project directory:
   `d:\Workspace\ESP32 CAM\Web UI\smart-attendanceESP32`

2. **Install Dependencies**:
   Run the following command to install all necessary libraries:
   ```bash
   npm install
   ```

3. **(Optional) Configure Environment**:
   If you want to use the AI features (Gemini), create a file named `.env` in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *Note: The app works fine without this, but AI insights will be disabled.*

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Once the server starts, it will show a URL (usually `http://localhost:5173`). Open this in your web browser.

## Project Structure Note

- **Frontend**: The app is a React Single Page Application (SPA).
- **Backend**: There are PHP files (`AttendanceController.php`), but they are **currently unused** by the frontend. The frontend uses **Mock Data** by default for demonstration purposes.
- **Data**: All data (employees, attendance) is simulated in client-side memory. Refreshing the page will reset the data.

## Troubleshooting

- If `npm install` fails, try deleting `node_modules` and `package-lock.json` and running it again.
- If the port is busy, Vite will automatically try the next available port.
