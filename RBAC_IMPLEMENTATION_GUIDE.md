# Role-Based Access Control (RBAC) Guide

SmartAttend uses Role-Based Access Control (RBAC) to define custom access levels. This allows us to give different users (like Admins, Teachers, and Students) specific access without making everyone a system administrator.

## The Tool: `spatie/laravel-permission`
We use this package because it is the industry standard for Laravel. It handles the database schema and provides easy-to-use methods for checking access across the stack.

---

## 🏗️ 1. Database Level (The Foundation)
The package uses 5 tables in the database:
1.  **`roles`**: Stores the names of the roles (e.g., `admin`, `teacher`, `student`).
2.  **`permissions`**: Stores the granular actions someone can take (e.g., `view all reports`, `manage users`, `manage settings`).
3.  **`model_has_roles`**: Maps a User to a specific Role.
4.  **`model_has_permissions`**: Allows giving specific permissions directly to a User.
5.  **`role_has_permissions`**: Maps Permissions to a Role.

These are initially populated by the `RolesAndPermissionsSeeder.php`, which is called during `php artisan migrate:fresh --seed`.

---

## 🛡️ 2. Backend Level (Laravel API & Controllers)
The backend is secured so that unauthorized users cannot perform actions or access data without permission.

**Implementation:**
We protect groups of routes at the `web.php` level using the Spatie middleware.

```php
// In web.php
// Only users with the 'manage settings' permission can access these routes
Route::middleware(['permission:manage settings'])->group(function () {
    Route::get('/settings', [AttendanceController::class, 'settings'])->name('settings');
    Route::post('/settings', [AttendanceController::class, 'updateSettings'])->name('settings.update');
});
```

Additionally, in `AttendanceController.php`, when users are created or updated, their Spatie role is assigned or synchronized:
```php
$user->assignRole('teacher'); // Assigns the 'teacher' role
$profile->user->syncRoles(['student']); // Ensures the user only has the 'student' role
```

---

## 🖥️ 3. Frontend Level (React + Inertia)
We prevent unauthorized users from seeing buttons or menu items they can't access.

**The Implementation:**
1.  In Laravel's `HandleInertiaRequests.php` middleware, we universally share the current logged-in user's roles and permissions to the frontend on every page load inside the `auth` prop.
2.  In React, we use the `<Can />` wrapper component (`resources/js/Components/Can.tsx`) to conditionally render UI elements.

**Example Result:**
The "Settings" and "Staff" tabs in the `Sidebar.tsx` will physically disappear for anyone who does not hold the necessary permissions (e.g. a `teacher` or `student`).

```tsx
<Can permission="manage settings">
    <Link href="/settings">Settings</Link>
</Can>
```

---

## 🎯 Current Roles in SmartAttend

The system currently uses the following baseline roles defined in `RolesAndPermissionsSeeder.php`:

| Role Name | Granted Permissions | Description |
| :--- | :--- | :--- |
| **admin** | *All Permissions* | Full system control. Can change global settings, manage all users and profiles, and view all reports. |
| **teacher** | `manage attendance`, `post announcements`, `approve requests`, `view own attendance`, `submit requests` | Manages day-to-day student data, attendance, and requests, but cannot change system-level configurations or manage other staff. |
| **student** | `view own attendance`, `submit requests` | The basic user. Can only see their own attendance data and submit leave/correction requests. |

---

## Modifying Access
To change what a role can do:
1. Update `RolesAndPermissionsSeeder.php` with the new or modified permissions.
2. Update the frontend UI using the `<Can>` component to check for the new permissions.
3. Update `web.php` to protect backend routes matching the new permissions.
