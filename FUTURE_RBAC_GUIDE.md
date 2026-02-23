# Role-Based Access Control (RBAC) Implementation Plan

Adding Roles and Permissions to SmartAttend will allow us to define completely custom access levels. This is critical for enterprise software so you can give HR managers different access than regular employees without making everyone an Admin.

## The Tool: `spatie/laravel-permission`
We will use this package because it is the industry standard for Laravel. It handles the database schema and provides easy-to-use methods for checking access.

---

## 🏗️ 1. Database Level (The Foundation)
The package will create 5 new tables in your clean database:
1.  **`roles`**: Stores the names of the roles (e.g., `Super Admin`, `HR Manager`, `Employee`).
2.  **`permissions`**: Stores the granular actions someone can take (e.g., `view reports`, `manage employees`, `edit settings`, `approve leave`).
3.  **`model_has_roles`**: Maps a User to a specific Role (e.g., User ID 5 is an `HR Manager`).
4.  **`model_has_permissions`**: Allows giving specific permissions directly to a User (less common, usually we assign permissions to the Role).
5.  **`role_has_permissions`**: Maps Permissions to a Role (e.g., the `HR Manager` role is granted the `manage employees` permission).

---

## 🛡️ 2. Backend Level (Laravel API & Controllers)
We will secure the backend so that even if someone guesses a URL, they cannot perform actions without permission.

**Example Implementation:**
We update controllers to explicitly check permissions before executing critical code.

```php
// In AttendanceController.php
public function updateSettings(Request $request) 
{
    // The system instantly blocks users without this permission
    if (!Auth::user()->can('manage settings')) {
        abort(403, 'Unauthorized action.');
    }

    // ... proceed with saving settings ...
}
```

We can also protect entire groups of routes at the `web.php` level using middleware (e.g., `->middleware('permission:view reports')`).

---

## 🖥️ 3. Frontend Level (React + Inertia)
We don't want unauthorized users to see buttons they can't click (which leads to 403 errors). 

**The Implementation:**
1.  In Laravel's `HandleInertiaRequests.php` middleware, we will universally share the current logged-in user's roles and permissions to the frontend on every page load.
2.  In React, we create a helper or wrapper component (e.g., `<Can permission="manage employees"> ... </Can>`) to conditionally render UI elements.

**Example Result:**
The "System Settings" tab in the sidebar will physically disappear for anyone who does not hold the `manage settings` permission.

---

## 🎯 Proposed Initial Roles for SmartAttend

If we proceed, I propose we start by seeding these baseline roles:

| Role Name | Granted Permissions | Description |
| :--- | :--- | :--- |
| **Super Admin** | *All Permissions* (via wildcard or explicit assignment) | Full system control. Can change global settings, API keys, and manage all users. |
| **HR Manager** | `manage employees`, `view reports`, `manage attendance`, `post announcements`, `approve requests` | Manages the day-to-day workforce data but cannot change system-level configurations. |
| **Employee** | `view own attendance`, `submit requests` | The basic user. Can only see their own data and submit leave requests. |

---

## Next Steps
If this plan sounds good to you, the first step is for me to install `spatie/laravel-permission` via Composer, run its database migrations, and create a seeder to build these initial Roles and Roles table!
