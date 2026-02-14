# SmartAttend - AI-Powered Attendance Management System

SmartAttend is a modern, responsive employee attendance tracking solution designed for both administrative efficiency and employee transparency. It features real-time data visualization, AI-driven insights via the Google Gemini API, and a streamlined workflow for profile management.

## 🚀 Key Features

### 📊 Real-Time Dashboard
- **Dynamic Filtering**: View attendance trends across **Weekly**, **Monthly**, and **Yearly** timeframes.
- **Visual Analytics**: Interactive bar charts (via Recharts) displaying Present, Late, and Absent trends.
- **Quick Attendance View**: A paginated list (max 5 rows) of today's active employee records.
- **Live Notifications**: A sidebar for company announcements, sortable by **Latest** or **Priority** (Urgent/High/Normal), limited to the 5 most relevant updates.

### 👥 Employee Management (Admin Only)
- **Full CRUD Operations**: Add, edit, or remove employees from the system.
- **Advanced Filtering**: Search by name/department/role and filter by employment status (Active, On Leave, Terminated).
- **Profile Previews**: Detailed modal views for individual employee data.

### 📝 Profile & Requests System
- **Employee Profiles**: A dedicated, read-only profile page for employees to view their employment and contact details securely.
- **Update Requests**: Employees can submit formal "Request Update" forms to notify admins of changes needed to their profile (e.g., address or phone number updates).
- **Admin Requests Portal**: A centralized inbox for admins to review, resolve, or dismiss profile update requests submitted by the team.

### 📈 Reports & AI Insights
- **Detailed Logs**: Comprehensive attendance table with status-based filtering and pagination.
- **CSV Export**: One-click data export for external processing or payroll.
- **Gemini AI Integration**: Leverages the **gemini-3-flash-preview** model to analyze attendance patterns and provide actionable HR recommendations and operational insights.

### 📢 Announcements
- **Priority-Based Communication**: Post company-wide updates with varying urgency levels.
- **Full History**: Dedicated announcements page with specialized styling for "Urgent" notices.

---

## 🛠️ Technical Stack

- **Frontend**: React 19 (ESM), TypeScript.
- **Styling**: Tailwind CSS (Light Mode Optimized).
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **AI Integration**: Google GenAI SDK (@google/genai).
- **Infrastructure**: Environment-based API key management.

---

## 👤 User Roles

### 1. Attendance Mode (Employee)
- Access to the Dashboard.
- View and sort company announcements.
- View personal Profile (Read-only).
- Submit Profile Update Requests.
- Receive notifications about important office updates.

### 2. Admin Portal
- Access to all Employee features.
- Manage the Employee directory.
- Review and manage Profile Update Requests.
- Configure system Settings (Company name, Late thresholds, Weekly schedules).
- Generate and Export Reports.
- Trigger AI Insights for high-level management analysis.

---

## ⚙️ Configuration

The application allows admins to customize:
- **Company Name**: Appears across the dashboard and reports.
- **Late Threshold**: Define the grace period (in minutes) before a check-in is flagged as "Late".
- **Weekly Schedule**: Set working days, holidays, and standard shift hours (Start/End times).

---

*SmartAttend is designed with aesthetics and functionality in mind, ensuring a professional user experience for modern workspaces.*