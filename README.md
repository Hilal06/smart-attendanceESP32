# SmartAttend - AI-Powered Attendance Management System

SmartAttend is a sophisticated, enterprise-ready attendance management platform. It combines a robust React-based frontend with an Inertia.js bridge and an AI-driven analytics core to streamline HR operations and employee engagement.

## 🌟 Project Summary
SmartAttend serves two primary user archetypes: **Admins**, who manage the organization's workforce and settings, and **Employees**, who track their own status and communicate with HR. The system is designed for high performance, utilizing a modern ESM-based frontend architecture and a lightweight JSON data layer for rapid prototyping and deployment.

---

## 📦 Dependency List
The application leverages a curated stack of modern web technologies, imported via ESM for optimal performance:

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.4` | Core UI library for component-based architecture. |
| **Lucide React** | `^0.563.0` | Accessible, consistent iconography. |
| **Recharts** | `^3.7.0` | Data visualization for attendance trends and distributions. |
| **@google/genai** | `^1.41.0` | Integration with Google Gemini for AI-powered insights. |
| **@inertiajs/react**| `^2.3.15` | Seamless routing and state synchronization between server and client. |
| **Tailwind CSS** | CDN / JIT | Utility-first styling with dark mode support. |
| **Inter Font** | Google Fonts | Primary typeface for high readability. |

---

## 🛠️ Core Functions

### 1. Workforce Lifecycle Management (CRUD)
- **Employee Directory**: Full management of employee records including profile photos, contact info, and department assignment.
- **Status Lifecycle**: Track employees as `Active`, `On Leave`, or `Terminated` with specific UI feedback.

### 2. Intelligent Reporting & Analytics
- **Gemini AI Insights**: Automated analysis of raw attendance data to identify lateness patterns and provide operational recommendations.
- **Visual Trends**: Multi-timeframe bar charts (Weekly/Monthly/Yearly) and status pie charts for instant organizational health checks.
- **CSV Export**: Standardized data portability for external payroll or compliance auditing.

### 3. Communication & Requests
- **Priority Announcements**: Tiered notification system (`Urgent`, `High`, `Normal`) with unique visual styling for critical updates.
- **Self-Service Requests**: Employees can submit profile update requests, which admins can review and resolve in a dedicated portal.

### 4. Localization & Configuration
- **Bilingual Support**: Full application translation between English and Bahasa Indonesia.
- **Shift Logic**: Configurable grace periods (late thresholds) and custom weekly schedules for different organizational needs.

---

## 🤖 Tools & Integrations

### Gemini AI Integration
The app utilizes the **Gemini 3 Flash Preview** model (`gemini-3-flash-preview`) via the `@google/genai` SDK.
- **Function**: Processes `AttendanceRecord[]` and `Employee[]` data summaries.
- **Output**: Generates formatted HTML insights focusing on attendance trends and actionable HR advice.
- **Security**: Requires an environment-variable based API key.

### Data Persistence (`db.json`)
The application uses a server-side JSON database for persistence, managed by the `AttendanceController`.
- **Structure**: Tracks `settings`, `employees`, `attendance`, `announcements`, and `requests`.
- **Logic**: Implements atomic updates via Laravel's `Storage` facade to prevent data corruption during simultaneous writes.

---

## ⚙️ Setup & Requirements

### 🔑 Environment Variables
The application requires the following key to enable AI features:
- `process.env.API_KEY`: A valid Google AI Studio API Key.

### 🌐 Browser Requirements
- **JavaScript**: Must be enabled for ESM module loading and React rendering.
- **Local Storage**: Used for session persistence and UI state.
- **Connectivity**: Required for initial asset loading and Gemini API calls.

---

*SmartAttend: Engineering organizational efficiency through intelligent design.*