
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;

Route::get('/', [AttendanceController.class, 'dashboard'])->name('dashboard');

// Employees
Route::get('/employees', [AttendanceController.class, 'employees'])->name('employees');
Route::post('/employees', [AttendanceController.class, 'storeEmployee'])->name('employees.store');
Route::put('/employees/{id}', [AttendanceController.class, 'updateEmployee'])->name('employees.update');
Route::delete('/employees/{id}', [AttendanceController.class, 'deleteEmployee'])->name('employees.destroy');

// Reports
Route::get('/reports', [AttendanceController.class, 'reports'])->name('reports');

// Settings
Route::get('/settings', [AttendanceController.class, 'settings'])->name('settings');
Route::post('/settings', [AttendanceController.class, 'updateSettings'])->name('settings.update');

// Announcements
Route::get('/announcements', [AttendanceController.class, 'announcements'])->name('announcements');

// Requests
Route::get('/requests', [AttendanceController.class, 'requests'])->name('requests');

// Profile
Route::get('/profile', [AttendanceController.class, 'profile'])->name('profile');
