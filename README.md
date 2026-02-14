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

## 💾 Database Structure (`db.json`)

The application acts as a Flat-File CMS, storing all data in `storage/app/db.json`. While there is no SQL database, the JSON structure mimics relational tables:

#### **Employees Table** (`employees`)
Stores workforce profiles.
- `id`: Unique Identifier (String)
- `name`: Full Name (String)
- `email`: Contact Email (String)
- `role`: Job Title (String)
- `department`: Department Name (String)
- `avatar`: URL to profile image (String)
- `joinDate`: Date of joining (YYYY-MM-DD)
- `status`: `Active` | `On Leave` | `Terminated`

#### **Attendance Table** (`attendance`)
Tracks daily presence.
- `id`: Unique Record ID (String, e.g., "USERID-DATE")
- `employeeId`: Foreign Key to Employees (String)
- `date`: Record Date (YYYY-MM-DD)
- `checkIn`: Time (HH:MM) or null
- `checkOut`: Time (HH:MM) or null
- `status`: `Present` | `Late` | `Absent` | `On Leave`

#### **Announcements Table** (`announcements`)
Company-wide news feed.
- `id`: Unique ID (String)
- `title`: Headline (String)
- `content`: Body text (String)
- `priority`: `Normal` | `High` | `Urgent`
- `date`: Posted Date (YYYY-MM-DD)

#### **Requests Table** (`requests`)
Employee profile update requests.
- `id`: Unique Request ID (String)
- `employeeId`: Foreign Key to Employees (String)
- `description`: Details of the requested change (String)
- `status`: `Pending` | `Resolved`
- `date`: Request Timestamp (ISO String)

#### **Settings Object** (`settings`)
Global application configuration.
- `companyName`: Display name of the org.
- `companyLogo`: Base64 string or URL.
- `lateThresholdMinutes`: Grace period in minutes.
- `weeklySchedule`: Array defining work days vs off days.

---

## 🤖 Tools & Integrations

### Gemini AI Integration
The app utilizes the **Gemini 3 Flash Preview** model (`gemini-3-flash-preview`) via the `@google/genai` SDK.
- **Function**: Processes `AttendanceRecord[]` and `Employee[]` data summaries.
- **Output**: Generates formatted HTML insights focusing on attendance trends and actionable HR advice.
- **Security**: Requires an environment-variable based API key.

### Data Persistence
The application uses a server-side JSON database for persistence, managed by the `AttendanceController`.
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