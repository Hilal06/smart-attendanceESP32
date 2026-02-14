
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
                'settings' => [],
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

    public function dashboard()
    {
        $db = $this->getDb();
        return Inertia::render('Dashboard', [
            'userRole' => 'admin',
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
            'userRole' => 'admin',
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
            'userRole' => 'admin',
            'settings' => $db['settings'],
            'attendance' => $db['attendance'],
            'employees' => $db['employees']
        ]);
    }

    public function settings()
    {
        $db = $this->getDb();
        return Inertia::render('Settings', [
            'userRole' => 'admin',
            'settings' => $db['settings']
        ]);
    }

    public function announcements()
    {
        $db = $this->getDb();
        return Inertia::render('Announcements', [
            'userRole' => 'admin',
            'settings' => $db['settings'],
            'announcements' => $db['announcements']
        ]);
    }

    public function requests()
    {
        $db = $this->getDb();
        return Inertia::render('Requests', [
            'userRole' => 'admin',
            'settings' => $db['settings'],
            'requests' => $db['requests'],
            'employees' => $db['employees']
        ]);
    }

    public function profile()
    {
        $db = $this->getDb();
        // For simulation, we'll pick the first employee as the logged-in profile
        $employee = $db['employees'][0] ?? null;
        return Inertia::render('Profile', [
            'userRole' => 'attendance',
            'settings' => $db['settings'],
            'employee' => $employee
        ]);
    }
}
