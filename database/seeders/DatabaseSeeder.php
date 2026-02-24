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

        if (!\App\Models\User::where('email', 'admin@smartattend.com')->exists()) {
            \App\Models\User::create([
               'name' => 'Admin User',
               'email' => 'admin@smartattend.com',
               'password' => bcrypt('password'),
               'role' => 'super_admin',
            ]);
        }

        $this->call([
            RolesAndPermissionsSeeder::class,
        ]);

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

        // Profiles
        if (isset($data['profiles'])) {
            foreach ($data['profiles'] as $emp) {
                try {
                    $roleLabel = strtolower($emp['role'] ?? 'student');
                    if (!in_array($roleLabel, ['super_admin', 'teacher', 'student'])) {
                        $roleLabel = 'student';
                    }

                    $user = \App\Models\User::firstOrCreate(
                        ['email' => $emp['email']],
                        [
                            'name' => $emp['name'],
                            'password' => bcrypt('12345678'),
                            'role' => $roleLabel,
                        ]
                    );
                    $user->assignRole($roleLabel === 'super_admin' ? 'admin' : $roleLabel);

                    \App\Models\Profile::create([
                        'id' => $emp['id'],
                        'user_id' => $user->id,
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
                    $this->command->warn("Skipping profile {$emp['id']}: " . $e->getMessage());
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
                    if (\App\Models\Profile::where('id', $att['employeeId'])->exists()) {
                        \App\Models\Attendance::create([
                            'id' => $att['id'],
                            'profile_id' => $att['employeeId'],
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
                     if (\App\Models\Profile::where('id', $req['employeeId'])->exists()) {
                        \App\Models\ProfileRequest::create([
                            'id' => $req['id'],
                            'profile_id' => $req['employeeId'],
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

        // Dummy Teachers
        for ($i = 1; $i <= 6; $i++) {
            $user = \App\Models\User::firstOrCreate(
                ['email' => "teacher$i@smartattend.com"],
                [
                    'name' => "Teacher $i",
                    'password' => bcrypt('12345678'),
                    'role' => 'teacher',
                ]
            );
            $user->assignRole('teacher');

            \App\Models\Profile::firstOrCreate(
                ['email' => "teacher$i@smartattend.com"],
                [
                    'id' => "TCH" . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'user_id' => $user->id,
                    'name' => "Teacher $i",
                    'role' => 'Teacher',
                    'department' => 'Academics',
                    'join_date' => now()->format('Y-m-d'),
                    'status' => 'Active',
                ]
            );
        }

        // Dummy Students
        for ($i = 1; $i <= 5; $i++) {
            $user = \App\Models\User::firstOrCreate(
                ['email' => "student$i@smartattend.com"],
                [
                    'name' => "Student $i",
                    'password' => bcrypt('12345678'),
                    'role' => 'student',
                ]
            );
            $user->assignRole('student');

            \App\Models\Profile::firstOrCreate(
                ['email' => "student$i@smartattend.com"],
                [
                    'id' => "STU" . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'user_id' => $user->id,
                    'name' => "Student $i",
                    'role' => 'Student',
                    'department' => 'General',
                    'join_date' => now()->format('Y-m-d'),
                    'status' => 'Active',
                ]
            );
        }
    }
}
