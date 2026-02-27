<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;

// Auth Routes
Route::get('/login', [AttendanceController::class, 'loginPage'])->name('login');
Route::post('/login', [AttendanceController::class, 'authenticate'])->name('login.attempt');
Route::get('/register', [AttendanceController::class, 'registerPage'])->name('register');
Route::post('/register', [AttendanceController::class, 'register'])->name('register.submit');
Route::post('/logout', [AttendanceController::class, 'logout'])->name('logout');

use App\Http\Middleware\CheckUserSession;

// Protected Routes
Route::middleware([CheckUserSession::class])->group(function () {
    Route::get('/', [AttendanceController::class, 'dashboard'])->name('dashboard');

    // Profiles (Employees/Staff)
    Route::get('/profiles', [AttendanceController::class, 'profiles'])->middleware('permission:manage users')->name('profiles');

    Route::middleware(['permission:manage users|manage students'])->group(function () {
        Route::post('/profiles', [AttendanceController::class, 'storeProfile'])->name('profiles.store');
        Route::put('/profiles/{id}', [AttendanceController::class, 'updateProfile'])->name('profiles.update');
        Route::delete('/profiles/{id}', [AttendanceController::class, 'deleteProfile'])->name('profiles.destroy');
        Route::put('/profiles/{id}/toggle-password', [AttendanceController::class, 'togglePasswordPermission'])->name('profiles.password.toggle');
    });

    // Students
    Route::get('/students', [AttendanceController::class, 'students'])->name('students');

    // Reports
    Route::middleware(['permission:view all reports'])->group(function () {
        Route::get('/reports', [AttendanceController::class, 'reports'])->name('reports');
    });

    // Settings
    Route::middleware(['permission:manage settings'])->group(function () {
        Route::get('/settings', [AttendanceController::class, 'settings'])->name('settings');
        Route::post('/settings', [AttendanceController::class, 'updateSettings'])->name('settings.update');
        Route::post('/settings/admin', [AttendanceController::class, 'updateAdmin'])->name('settings.admin.update');
    });

    // Announcements
    Route::get('/announcements', [AttendanceController::class, 'announcements'])->name('announcements');
    Route::middleware(['permission:post announcements'])->group(function () {
        Route::post('/announcements', [AttendanceController::class, 'storeAnnouncement'])->name('announcements.store');
        Route::put('/announcements/{id}', [AttendanceController::class, 'updateAnnouncement'])->name('announcements.update');
        Route::delete('/announcements/{id}', [AttendanceController::class, 'deleteAnnouncement'])->name('announcements.destroy');
    });

    // Requests
    Route::get('/requests', [AttendanceController::class, 'requests'])->name('requests');
    Route::post('/requests', [AttendanceController::class, 'storeRequest'])->name('requests.store');
    Route::put('/requests/{id}', [AttendanceController::class, 'updateRequest'])->name('requests.update');
    Route::delete('/requests/{id}', [AttendanceController::class, 'deleteRequest'])->name('requests.destroy');

    // Profile
    Route::get('/profile', [AttendanceController::class, 'profile'])->name('profile');
    Route::post('/profile/password', [AttendanceController::class, 'updateProfilePassword'])->name('profile.password.update');
});
