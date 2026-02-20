<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Announcement;
use App\Models\EmployeeRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class AttendanceController extends Controller
{
    // --- Auth Methods ---

    public function loginPage()
    {
        if (session('userRole')) {
            return redirect()->route('dashboard');
        }
        $settings = Setting::first();
        return Inertia::render('Login', [
            'settings' => $settings
        ]);
    }

    public function authenticate(Request $request)
    {
        $role = $request->input('role');

        if ($role === 'admin') {
            $credentials = $request->validate([
                'email' => ['required', 'email'],
                'password' => ['required'],
            ]);

            if (\Illuminate\Support\Facades\Auth::attempt($credentials)) {
                $request->session()->regenerate();
                session(['userRole' => 'admin', 'userId' => 'admin']); // Keep session consistent for now
                return to_route('dashboard');
            }

            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        // Employee Login
        $id = $request->input('id');
        $employee = Employee::find($id);

        if ($employee) {
            session(['userRole' => 'attendance', 'userId' => $id]);
            return redirect()->route('dashboard');
        }

        return back()->withErrors([
            'id' => 'Employee ID not found.',
        ]);
    }

    public function logout(Request $request)
    {
        \Illuminate\Support\Facades\Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        session()->forget(['userRole', 'userId']);
        return redirect()->route('login');
    }

    // --- App Methods ---

    public function dashboard()
    {
        $settings = Setting::first();
        
        // Auto-seed: If no attendance records exist for TODAY, generate them.
        $today = now()->setTimezone('Asia/Jakarta')->format('Y-m-d');
        $hasToday = Attendance::where('date', $today)->exists();

        if (!$hasToday) {
            $employees = Employee::where('status', '!=', 'Terminated')->get();
            $insertData = [];
            foreach ($employees as $emp) {
                if (rand(1, 100) <= 15) {
                    $status = rand(0, 1) ? 'Absent' : 'On Leave';
                    $insertData[] = [
                        'id' => $emp->id . '-' . $today,
                        'employee_id' => $emp->id,
                        'date' => $today,
                        'check_in' => null,
                        'check_out' => null,
                        'status' => $status,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    continue;
                }

                $isLate = rand(1, 100) <= 20; 
                $status = $isLate ? 'Late' : 'Present';
                $hour = $isLate ? 9 : 8;
                $minute = $isLate ? rand(15, 45) : rand(45, 59);
                $checkIn = sprintf("%02d:%02d", $hour, $minute);
                $checkOut = rand(0, 1) ? '17:' . rand(0, 30) : null;

                $insertData[] = [
                    'id' => $emp->id . '-' . $today,
                    'employee_id' => $emp->id,
                    'date' => $today,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'status' => $status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if (!empty($insertData)) {
                Attendance::insert($insertData);
            }
        }

        // Performance Optimization: 
        // 1. Only fetch active employees with necessary fields
        // 2. Only fetch attendance for the last 40 days (enough for Month view + buffer)
        $msgDateLimit = now()->setTimezone('Asia/Jakarta')->subDays(40)->format('Y-m-d');
        
        $employees = Employee::select('id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status')
                     ->get(); // Could be paginated if list is huge, but dashboard chart needs filtering by employee

        $attendances = Attendance::where('date', '>=', $msgDateLimit)
                       ->orderBy('date', 'desc')
                       ->orderBy('check_in', 'desc')
                       ->select('id', 'employee_id', 'date', 'check_in', 'check_out', 'status')
                       ->get();

        return Inertia::render('Dashboard', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule, // Cast in model handles array
                'language' => $settings->language,
            ] : null,
            'employees' => $employees->map(function($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role,
                    'department' => $emp->department,
                    'avatar' => $emp->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($emp->name) . '&background=random',
                    'email' => $emp->email,
                    'joinDate' => $emp->join_date,
                    'phoneNumber' => $emp->phone_number,
                    'address' => $emp->address,
                    'status' => $emp->status,
                ];
            }),
            'attendance' => $attendances->map(function($att) {
                return [
                    'id' => $att->id,
                    'employeeId' => $att->employee_id,
                    'date' => $att->date,
                    'checkIn' => $att->check_in,
                    'checkOut' => $att->check_out,
                    'status' => $att->status,
                ];
            }),
            'announcements' => Announcement::orderBy('date', 'desc')->limit(10)->get()
        ]);
    }

    public function employees()
    {
        $settings = Setting::first();
        return Inertia::render('Employees', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'employees' => Employee::all()->map(function($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role,
                    'department' => $emp->department,
                    'avatar' => $emp->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($emp->name) . '&background=random',
                    'email' => $emp->email,
                    'joinDate' => $emp->join_date,
                    'phoneNumber' => $emp->phone_number,
                    'address' => $emp->address,
                    'status' => $emp->status,
                ];
            })
        ]);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->all();
        // Map camelCase to snake_case
        $updateData = [];
        if (isset($data['companyName'])) $updateData['company_name'] = $data['companyName'];
        if (isset($data['companyLogo'])) $updateData['company_logo'] = $data['companyLogo'];
        if (isset($data['lateThresholdMinutes'])) $updateData['late_threshold_minutes'] = $data['lateThresholdMinutes'];
        if (isset($data['weeklySchedule'])) $updateData['weekly_schedule'] = $data['weeklySchedule'];
        if (isset($data['language'])) $updateData['language'] = $data['language'];

        $settings = Setting::first();
        if ($settings) {
            $settings->update($updateData);
        } else {
            Setting::create($updateData);
        }
        return back()->with('message', 'Settings updated successfully');
    }

    public function storeEmployee(Request $request)
    {
        $data = $request->all();
        if (isset($data['joinDate'])) $data['join_date'] = $data['joinDate'];
        if (isset($data['phoneNumber'])) $data['phone_number'] = $data['phoneNumber'];
        
        if (empty($data['id'])) {
            $data['id'] = (string) rand(100000, 999999);
        }

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            // Save as ID.extension (e.g. 123456.jpg)
            $filename = $data['id'] . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $data['avatar'] = Storage::url($path);
        }
        
        Employee::create($data);
        return back();
    }

    public function updateEmployee(Request $request, $id)
    {
        $employee = Employee::find($id);
        if ($employee) {
            $data = $request->all();
            if (isset($data['joinDate'])) $data['join_date'] = $data['joinDate'];
            if (isset($data['phoneNumber'])) $data['phone_number'] = $data['phoneNumber'];

            // Handle Avatar Upload
            if ($request->hasFile('avatar')) {
                // Delete old avatar if it exists
                if ($employee->avatar && str_contains($employee->avatar, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $employee->avatar);
                    Storage::disk('public')->delete($oldPath);
                }

                $file = $request->file('avatar');
                // Save as ID.extension
                $filename = $employee->id . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('avatars', $filename, 'public');
                $data['avatar'] = Storage::url($path);
            }

            $employee->update($data);
        }
        return back();
    }

    public function deleteEmployee($id)
    {
        Employee::destroy($id);
        return back();
    }

    public function reports()
    {
        $settings = Setting::first();
        return Inertia::render('Reports', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'attendance' => Attendance::all()->map(function($att) {
                return [
                    'id' => $att->id,
                    'employeeId' => $att->employee_id,
                    'date' => $att->date,
                    'checkIn' => $att->check_in,
                    'checkOut' => $att->check_out,
                    'status' => $att->status,
                ];
            }),
            'employees' => Employee::all()->map(function($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role,
                    'department' => $emp->department,
                    'avatar' => $emp->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($emp->name) . '&background=random',
                    'email' => $emp->email,
                    'joinDate' => $emp->join_date,
                    'phoneNumber' => $emp->phone_number,
                    'address' => $emp->address,
                    'status' => $emp->status,
                ];
            })
        ]);
    }

    public function settings()
    {
        $settings = Setting::first();
        return Inertia::render('Settings', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null
        ]);
    }

    public function announcements()
    {
        $settings = Setting::first();
        return Inertia::render('Announcements', [
            'userRole' => session('userRole'),
            'settings' => $settings,
            'announcements' => Announcement::orderBy('date', 'desc')->get()
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $data = $request->all();
        if (!isset($data['id'])) {
            $data['id'] = (string)time();
        }
        Announcement::create($data);
        return back();
    }

    public function updateAnnouncement(Request $request, $id)
    {
        $announcement = Announcement::find($id);
        if ($announcement) {
            $announcement->update($request->all());
        }
        return back();
    }

    public function deleteAnnouncement($id)
    {
        Announcement::destroy($id);
        return back();
    }

    public function requests()
    {
        $settings = Setting::first();
        
        $requests = EmployeeRequest::with('employee')->orderBy('date', 'desc')->get()->map(function($req) {
             // Map snake_case to camelCase for frontend
             $req->employeeId = $req->employee_id;
             return $req;
        });

        // Ensure array if null? get() returns Collection. map() returns Collection.
        // Frontend expects array, Inertia converts Collection to array.

        return Inertia::render('Requests', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'requests' => $requests,
            'employees' => Employee::all()->map(function($emp) {
                 return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role, // Used in requests view to show role?
                    'department' => $emp->department,
                    // Minimal fields needed for requests might be enough, but consistency is safer
                    'joinDate' => $emp->join_date,
                    'phoneNumber' => $emp->phone_number,
                    'status' => $emp->status,
                    'avatar' => $emp->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($emp->name) . '&background=random',
                    'email' => $emp->email,
                 ];
            })
        ]);
    }

    public function storeRequest(Request $request)
    {
        $data = $request->all();
        if (!isset($data['id'])) {
            $data['id'] = (string)time();
        }
        
        // Handle frontend camelCase to backend snake_case
        if (isset($data['employeeId'])) {
            $data['employee_id'] = $data['employeeId'];
        }

        EmployeeRequest::create($data);
        return back();
    }

    public function updateRequest(Request $request, $id)
    {
        $req = EmployeeRequest::find($id);
        if ($req) {
            // Frontend sends status updates
            $req->update($request->only('status'));
        }
        return back();
    }

    public function deleteRequest($id)
    {
        EmployeeRequest::destroy($id);
        return back();
    }

    public function profile()
    {
        $settings = Setting::first();
        $userId = session('userId');
        
        $employee = null;
        if ($userId) {
            $employee = Employee::find($userId);
        }
        
        if (!$employee) {
            $employee = Employee::first();
        }
        
        $requests = [];
        if ($employee) {
             $requests = EmployeeRequest::where('employee_id', $employee->id)->get()->map(function($req) {
                $req->employeeId = $req->employee_id;
                return $req;
            });
        }

        // Transform Employee for Profile
        $transformedEmployee = $employee ? [
            'id' => $employee->id,
            'name' => $employee->name,
            'role' => $employee->role,
            'department' => $employee->department,
            'avatar' => $employee->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($employee->name) . '&background=random',
            'email' => $employee->email,
            'joinDate' => $employee->join_date,
            'phoneNumber' => $employee->phone_number,
            'address' => $employee->address,
            'status' => $employee->status,
        ] : null;

        return Inertia::render('Profile', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'employee' => $transformedEmployee,
            'requests' => $requests
        ]);
    }

    // --- API Methods for ESP32 ---

    public function storeAttendanceApi(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $employeeId = $request->input('employee_id');
        $today = now()->setTimezone('Asia/Jakarta')->format('Y-m-d');
        $now = now()->setTimezone('Asia/Jakarta');
        $timeString = $now->format('H:i');

        $attendanceId = $employeeId . '-' . $today;
        $attendance = Attendance::find($attendanceId);

        if ($attendance) {
            // Already checked in? Check out.
            $attendance->update([
                'check_out' => $timeString,
                'status' => 'Present', // Or keep existing status? safe to say Present if they checked out
            ]);

            return response()->json([
                'status' => 'success',
                'type' => 'check_out',
                'message' => 'Goodbye! Checked out at ' . $timeString,
                'data' => $attendance
            ]);
        } else {
            // Check In
            $status = 'Present';
            // Simple logic: Late if after 9:00 AM
            if ($now->hour >= 9 && $now->minute > 0) {
                $status = 'Late';
            }

            $attendance = Attendance::create([
                'id' => $attendanceId,
                'employee_id' => $employeeId,
                'date' => $today,
                'check_in' => $timeString,
                'check_out' => null,
                'status' => $status
            ]);

            return response()->json([
                'status' => 'success',
                'type' => 'check_in',
                'message' => 'Welcome! Checked in at ' . $timeString,
                'data' => $attendance
            ]);
        }
    }
}
