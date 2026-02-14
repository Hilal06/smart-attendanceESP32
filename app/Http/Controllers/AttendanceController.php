<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AttendanceController extends Controller
{
    private $dbPath = 'db.json';

    /**
     * Helper to read the JSON database.
     */
    private function getDb()
    {
        if (!Storage::exists($this->dbPath)) {
            return [
                'settings' => [
                    "companyName" => "SmartAttend Inc",
                    "companyLogo" => "",
                    "lateThresholdMinutes" => 15,
                    "weeklySchedule" => [
                        [ "day" => "Monday", "status" => "Work Day", "startTime" => "09:00", "endTime" => "17:00" ],
                        [ "day" => "Tuesday", "status" => "Work Day", "startTime" => "09:00", "endTime" => "17:00" ],
                        [ "day" => "Wednesday", "status" => "Work Day", "startTime" => "09:00", "endTime" => "17:00" ],
                        [ "day" => "Thursday", "status" => "Work Day", "startTime" => "09:00", "endTime" => "17:00" ],
                        [ "day" => "Friday", "status" => "Work Day", "startTime" => "09:00", "endTime" => "17:00" ],
                        [ "day" => "Saturday", "status" => "Off Day", "startTime" => "09:00", "endTime" => "17:00" ],
                        [ "day" => "Sunday", "status" => "Off Day", "startTime" => "09:00", "endTime" => "17:00" ]
                    ],
                    "language" => "en"
                ],
                'employees' => [],
                'attendance' => [],
                'announcements' => [],
                'requests' => []
            ];
        }
        return json_decode(Storage::get($this->dbPath), true);
    }

    /**
     * Helper to write to the JSON database.
     */
    private function saveDb($data)
    {
        Storage::put($this->dbPath, json_encode($data, JSON_PRETTY_PRINT));
    }

    // --- Auth Methods ---

    public function loginPage()
    {
        if (session('userRole')) {
            return redirect()->route('dashboard');
        }
        $db = $this->getDb();
        return Inertia::render('Login', [
            'settings' => $db['settings']
        ]);
    }

    public function authenticate(Request $request)
    {
        $role = $request->input('role');
        $id = $request->input('id');

        // Simple mock authentication
        session(['userRole' => $role, 'userId' => $id]);
        return redirect()->route('dashboard');
    }

    public function logout()
    {
        session()->forget(['userRole', 'userId']);
        return redirect()->route('login');
    }

    // --- App Methods ---

    public function dashboard()
    {
        $db = $this->getDb();
        
        // Auto-seed: If no attendance records exist for TODAY, generate them.
        // This ensures the dashboard always looks alive for demos.
        $today = now()->setTimezone('Asia/Jakarta')->format('Y-m-d');
        $hasToday = false;
        foreach ($db['attendance'] as $record) {
            if ($record['date'] === $today) {
                $hasToday = true;
                break;
            }
        }

        if (!$hasToday && !empty($db['employees'])) {
            $newRecords = [];
            foreach ($db['employees'] as $emp) {
                // Skip if terminated
                if (($emp['status'] ?? 'Active') === 'Terminated') continue;
                
                // 15% chance of being Absent/On Leave to show variety
                if (rand(1, 100) <= 15) {
                    $status = rand(0, 1) ? 'Absent' : 'On Leave';
                    $newRecords[] = [
                        'id' => $emp['id'] . '-' . $today,
                        'employeeId' => $emp['id'],
                        'date' => $today,
                        'checkIn' => null,
                        'checkOut' => null,
                        'status' => $status
                    ];
                    continue;
                }

                // Generate Present/Late
                $isLate = rand(1, 100) <= 20; // 20% late
                $status = $isLate ? 'Late' : 'Present';
                
                // Check in time
                $hour = $isLate ? 9 : 8;
                $minute = $isLate ? rand(15, 45) : rand(45, 59);
                $checkIn = sprintf("%02d:%02d", $hour, $minute);
                
                // Check out time (sometimes empty if currently working)
                $checkOut = null;
                // If it's already "evening" in simulation, add checkout
                if (rand(0, 1)) {
                    $checkOut = '17:' . rand(0, 30);
                }

                $newRecords[] = [
                    'id' => $emp['id'] . '-' . $today,
                    'employeeId' => $emp['id'],
                    'date' => $today,
                    'checkIn' => $checkIn,
                    'checkOut' => $checkOut,
                    'status' => $status
                ];
            }
            // Add to DB
            $db['attendance'] = array_merge($db['attendance'], $newRecords);
            $this->saveDb($db);
        }

        return Inertia::render('Dashboard', [
            'userRole' => session('userRole'),
            'settings' => $db['settings'],
            'employees' => $db['employees'],
            'attendance' => $db['attendance'],
            'announcements' => $db['announcements']
        ]);
    }

    public function employees()
    {
        $db = $this->getDb();
        return Inertia::render('Employees', [
            'userRole' => session('userRole'),
            'settings' => $db['settings'],
            'employees' => $db['employees']
        ]);
    }

    public function updateSettings(Request $request)
    {
        $db = $this->getDb();
        $db['settings'] = $request->all();
        $this->saveDb($db);
        return back()->with('message', 'Settings updated successfully');
    }

    public function storeEmployee(Request $request)
    {
        $db = $this->getDb();
        $newEmployee = $request->all();
        $db['employees'][] = $newEmployee;
        $this->saveDb($db);
        return back();
    }

    public function updateEmployee(Request $request, $id)
    {
        $db = $this->getDb();
        foreach ($db['employees'] as &$emp) {
            if ($emp['id'] == $id) {
                $emp = array_merge($emp, $request->all());
                break;
            }
        }
        $this->saveDb($db);
        return back();
    }

    public function deleteEmployee($id)
    {
        $db = $this->getDb();
        $db['employees'] = array_values(array_filter($db['employees'], function($e) use ($id) {
            return $e['id'] != $id;
        }));
        $this->saveDb($db);
        return back();
    }

    public function reports()
    {
        $db = $this->getDb();
        return Inertia::render('Reports', [
            'userRole' => session('userRole'),
            'settings' => $db['settings'],
            'attendance' => $db['attendance'],
            'employees' => $db['employees']
        ]);
    }

    public function settings()
    {
        $db = $this->getDb();
        return Inertia::render('Settings', [
            'userRole' => session('userRole'),
            'settings' => $db['settings']
        ]);
    }

    public function announcements()
    {
        $db = $this->getDb();
        return Inertia::render('Announcements', [
            'userRole' => session('userRole'),
            'settings' => $db['settings'],
            'announcements' => $db['announcements']
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $db = $this->getDb();
        $newAnnouncement = $request->all();
        if (!isset($newAnnouncement['id'])) {
            $newAnnouncement['id'] = (string)time();
        }
        array_unshift($db['announcements'], $newAnnouncement);
        $this->saveDb($db);
        return back();
    }

    public function updateAnnouncement(Request $request, $id)
    {
        $db = $this->getDb();
        foreach ($db['announcements'] as &$ann) {
            if ($ann['id'] == $id) {
                $ann = array_merge($ann, $request->all());
                break;
            }
        }
        $this->saveDb($db);
        return back();
    }

    public function deleteAnnouncement($id)
    {
        $db = $this->getDb();
        $db['announcements'] = array_values(array_filter($db['announcements'], function($a) use ($id) {
            return $a['id'] != $id;
        }));
        $this->saveDb($db);
        return back();
    }

    public function requests()
    {
        $db = $this->getDb();
        return Inertia::render('Requests', [
            'userRole' => session('userRole'),
            'settings' => $db['settings'],
            'requests' => $db['requests'],
            'employees' => $db['employees']
        ]);
    }

    public function storeRequest(Request $request)
    {
        $db = $this->getDb();
        $newRequest = $request->all();
        if (!isset($newRequest['id'])) {
            $newRequest['id'] = (string)time();
        }
        array_unshift($db['requests'], $newRequest);
        $this->saveDb($db);
        return back();
    }

    public function updateRequest(Request $request, $id)
    {
        $db = $this->getDb();
        foreach ($db['requests'] as &$req) {
            if ($req['id'] == $id) {
                if ($request->has('status')) {
                    $req['status'] = $request->input('status');
                }
                break;
            }
        }
        $this->saveDb($db);
        return back();
    }

    public function deleteRequest($id)
    {
        $db = $this->getDb();
        $db['requests'] = array_values(array_filter($db['requests'], function($r) use ($id) {
            return $r['id'] != $id;
        }));
        $this->saveDb($db);
        return back();
    }

    public function profile()
    {
        $db = $this->getDb();
        $userId = session('userId');
        
        // Find logged in employee
        $employee = null;
        if ($userId) {
            foreach ($db['employees'] as $emp) {
                if ($emp['id'] == $userId) {
                    $employee = $emp;
                    break;
                }
            }
        }
        
        // Fallback for admin or if not found
        if (!$employee && !empty($db['employees'])) {
            $employee = $db['employees'][0];
        }

        return Inertia::render('Profile', [
            'userRole' => session('userRole'),
            'settings' => $db['settings'],
            'employee' => $employee,
            'requests' => $db['requests']
        ]);
    }
}
