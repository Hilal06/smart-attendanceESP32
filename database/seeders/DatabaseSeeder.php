<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        $path = storage_path('app/db.json');
        if (!file_exists($path)) {
            $this->command->error('db.json not found at ' . $path);
            return;
        }

        $json = file_get_contents($path);
        $data = json_decode($json, true);

        // Settings
        if (isset($data['settings'])) {
            \App\Models\Setting::create([
                'company_name' => $data['settings']['companyName'] ?? 'SmartAttend Inc',
                'company_logo' => $data['settings']['companyLogo'] ?? null,
                'late_threshold_minutes' => $data['settings']['lateThresholdMinutes'] ?? 15,
                'weekly_schedule' => $data['settings']['weeklySchedule'] ?? [],
                'language' => $data['settings']['language'] ?? 'en',
            ]);
        }

        // Employees
        if (isset($data['employees'])) {
            foreach ($data['employees'] as $emp) {
                try {
                    \App\Models\Employee::create([
                        'id' => $emp['id'],
                        'name' => $emp['name'],
                        'role' => $emp['role'],
                        'department' => $emp['department'],
                        'avatar' => $emp['avatar'] ?? null,
                        'email' => $emp['email'],
                        'join_date' => $emp['joinDate'],
                        'phone_number' => $emp['phoneNumber'] ?? null,
                        'address' => $emp['address'] ?? null,
                        'status' => $emp['status'] ?? 'Active',
                    ]);
                } catch (\Exception $e) {
                    $this->command->warn("Skipping employee {$emp['id']}: " . $e->getMessage());
                }
            }
        }

        // Announcements
        if (isset($data['announcements'])) {
            foreach ($data['announcements'] as $ann) {
                try {
                    \App\Models\Announcement::create([
                        'id' => $ann['id'],
                        'title' => $ann['title'],
                        'content' => $ann['content'],
                        'date' => $ann['date'],
                        'priority' => $ann['priority'],
                    ]);
                } catch (\Exception $e) {
                    $this->command->warn("Skipping announcement {$ann['id']}: " . $e->getMessage());
                }
            }
        }

        // Attendances
        if (isset($data['attendance'])) {
            foreach ($data['attendance'] as $att) {
                try {
                    if (\App\Models\Employee::where('id', $att['employeeId'])->exists()) {
                        \App\Models\Attendance::create([
                            'id' => $att['id'],
                            'employee_id' => $att['employeeId'],
                            'date' => $att['date'],
                            'check_in' => $att['checkIn'] ?? null,
                            'check_out' => $att['checkOut'] ?? null,
                            'status' => $att['status'],
                        ]);
                    }
                } catch (\Exception $e) {
                    $this->command->warn("Skipping attendance {$att['id']}: " . $e->getMessage());
                }
            }
        }

        // Requests
        if (isset($data['requests'])) {
            foreach ($data['requests'] as $req) {
                 try {
                     if (\App\Models\Employee::where('id', $req['employeeId'])->exists()) {
                        \App\Models\EmployeeRequest::create([
                            'id' => $req['id'],
                            'employee_id' => $req['employeeId'],
                            'description' => $req['description'],
                            'date' => \Carbon\Carbon::parse($req['date']),
                            'status' => $req['status'],
                        ]);
                     }
                 } catch (\Exception $e) {
                    $this->command->warn("Skipping request {$req['id']}: " . $e->getMessage());
                 }
            }
        }
    }
}
