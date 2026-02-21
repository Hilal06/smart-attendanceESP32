<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\AttendanceController;

Route::post('/attendance', [AttendanceController::class, 'storeAttendanceApi'])->middleware('api.key');
Route::get('/system/status', [AttendanceController::class, 'systemStatus']);
