<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;

// Auth Routes
Route::get('/login', [AttendanceController::class, 'loginPage'])->name('login');
Route::post('/login', [AttendanceController::class, 'authenticate'])->name('login.attempt');
Route::post('/logout', [AttendanceController::class, 'logout'])->name('logout');

// Protected Routes
Route::middleware(function ($request, $next) {
    if (!session('userRole')) {
        return redirect()->route('login');
    }
    return $next($request);
})->group(function () {
    Route::get('/', [AttendanceController::class, 'dashboard'])->name('dashboard');

    // Employees
    Route::get('/employees', [AttendanceController::class, 'employees'])->name('employees');
    Route::post('/employees', [AttendanceController::class, 'storeEmployee'])->name('employees.store');
    Route::put('/employees/{id}', [AttendanceController::class, 'updateEmployee'])->name('employees.update');
    Route::delete('/employees/{id}', [AttendanceController::class, 'deleteEmployee'])->name('employees.destroy');

    // Reports
    Route::get('/reports', [AttendanceController::class, 'reports'])->name('reports');

    // Settings
    Route::get('/settings', [AttendanceController::class, 'settings'])->name('settings');
    Route::post('/settings', [AttendanceController::class, 'updateSettings'])->name('settings.update');
    Route::post('/settings/admin', [AttendanceController::class, 'updateAdmin'])->name('settings.admin.update');

    // Announcements
    Route::get('/announcements', [AttendanceController::class, 'announcements'])->name('announcements');
    Route::post('/announcements', [AttendanceController::class, 'storeAnnouncement'])->name('announcements.store');
    Route::put('/announcements/{id}', [AttendanceController::class, 'updateAnnouncement'])->name('announcements.update');
    Route::delete('/announcements/{id}', [AttendanceController::class, 'deleteAnnouncement'])->name('announcements.destroy');

    // Requests
    Route::get('/requests', [AttendanceController::class, 'requests'])->name('requests');
    Route::post('/requests', [AttendanceController::class, 'storeRequest'])->name('requests.store');
    Route::put('/requests/{id}', [AttendanceController::class, 'updateRequest'])->name('requests.update');
    Route::delete('/requests/{id}', [AttendanceController::class, 'deleteRequest'])->name('requests.destroy');

    // Profile
    Route::get('/profile', [AttendanceController::class, 'profile'])->name('profile');
});
