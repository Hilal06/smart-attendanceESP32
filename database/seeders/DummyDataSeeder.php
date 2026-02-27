<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use App\Models\Setting;
use App\Models\Attendance;
use App\Models\Announcement;
use App\Models\ProfileRequest;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        echo "Seeding Roles...\n";
        $this->call(RolesAndPermissionsSeeder::class);

        $password = Hash::make('password123');

        echo "Seeding Admin...\n";
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@smartattend.com'],
            [
                'name' => 'Administrator',
                'password' => $password,
                'role' => 'super_admin',
            ]
        );
        $adminUser->assignRole('admin');

        Profile::updateOrCreate(
            ['id' => 'ADM-001'],
            [
                'user_id' => $adminUser->id,
                'name' => 'Administrator',
                'email' => 'admin@smartattend.com',
                'role' => 'Admin',
                'department' => 'IT Operations',
                'join_date' => '2023-01-01',
                'status' => 'Active',
            ]
        );

        echo "Seeding Settings...\n";
        Setting::updateOrCreate(
            ['id' => 1],
            [
                'company_name' => 'SmartAttend Academy',
                'late_threshold_minutes' => 15,
                'language' => 'en',
                'weekly_schedule' => [
                    ['day' => 'Monday', 'status' => 'Work Day', 'startTime' => '08:00', 'endTime' => '16:00'],
                    ['day' => 'Tuesday', 'status' => 'Work Day', 'startTime' => '08:00', 'endTime' => '16:00'],
                    ['day' => 'Wednesday', 'status' => 'Work Day', 'startTime' => '08:00', 'endTime' => '16:00'],
                    ['day' => 'Thursday', 'status' => 'Work Day', 'startTime' => '08:00', 'endTime' => '16:00'],
                    ['day' => 'Friday', 'status' => 'Work Day', 'startTime' => '08:00', 'endTime' => '16:00'],
                    ['day' => 'Saturday', 'status' => 'Off Day', 'startTime' => '09:00', 'endTime' => '12:00'],
                    ['day' => 'Sunday', 'status' => 'Off Day', 'startTime' => '09:00', 'endTime' => '12:00'],
                ]
            ]
        );

        echo "Seeding Teachers...\n";
        $teacherNames = [
            'Prof. Harrison Wells', 'Dr. Caitlin Snow', 'Joe West', 
            'Marcus Aurelius', 'Minerva McGonagall', 'Albus Dumbledore'
        ];
        $teacherDepts = ['Physics', 'Bio-Engineering', 'Criminal Justice', 'Philosophy', 'Transfiguration', 'Leadership'];
        
        $allProfileIds = [];

        foreach ($teacherNames as $i => $name) {
            $email = "teacher" . ($i + 1) . "@smartattend.com";
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => $password,
                    'role' => 'teacher',
                ]
            );
            $user->assignRole('teacher');

            $profileId = "TCH-" . str_pad($i + 101, 3, '0', STR_PAD_LEFT);
            $allProfileIds[] = $profileId;
            
            Profile::updateOrCreate(
                ['id' => $profileId],
                [
                    'user_id' => $user->id,
                    'name' => $name,
                    'email' => $email,
                    'role' => 'Teacher',
                    'department' => $teacherDepts[$i],
                    'join_date' => Carbon::now()->subMonths(rand(6, 24))->format('Y-m-d'),
                    'status' => 'Active',
                    'avatar' => "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=random",
                ]
            );
        }

        echo "Seeding Students...\n";
        $firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nora', 'Oscar', 'Paula', 'Quinn', 'Rose', 'Steve', 'Tina'];
        $lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Wilson', 'Moore', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia'];

        for ($i = 0; $i < 20; $i++) {
            $name = $firstNames[$i] . " " . $lastNames[rand(0, count($lastNames)-1)];
            $email = "student" . ($i + 1) . "@smartattend.com";
            
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => $password,
                    'role' => 'student',
                ]
            );
            $user->assignRole('student');

            $profileId = "STU-" . str_pad($i + 201, 4, '0', STR_PAD_LEFT);
            $allProfileIds[] = $profileId;

            Profile::updateOrCreate(
                ['id' => $profileId],
                [
                    'user_id' => $user->id,
                    'name' => $name,
                    'email' => $email,
                    'role' => 'Student',
                    'department' => 'Grade ' . rand(10, 12),
                    'join_date' => Carbon::now()->subMonths(rand(1, 12))->format('Y-m-d'),
                    'status' => 'Active',
                    'avatar' => "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=random",
                ]
            );
        }

        echo "Clear existing Announcements/Requests/Attendance for fresh data...\n";
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Attendance::truncate();
        ProfileRequest::truncate();
        Announcement::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        echo "Seeding Announcements...\n";
        $announcements = [
            ['title' => 'Final Exam Schedule', 'content' => 'The final exam schedule has been posted on the main bulletin board.', 'priority' => 'High'],
            ['title' => 'New Library Software', 'content' => 'We are migrating to a new library management system next week.', 'priority' => 'Normal'],
            ['title' => 'Science Fair 2026', 'content' => 'Registration for the annual Science Fair is now open for all grades.', 'priority' => 'Urgent'],
            ['title' => 'Parking Lot Maintenance', 'content' => 'Part of the North parking lot will be closed this Friday.', 'priority' => 'Normal'],
        ];

        foreach ($announcements as $i => $ann) {
            Announcement::create([
                'id' => (string)($i + 1),
                'title' => $ann['title'],
                'content' => $ann['content'],
                'priority' => $ann['priority'],
                'date' => Carbon::now()->subDays(rand(1, 10))->format('Y-m-d'),
            ]);
        }

        echo "Seeding Requests...\n";
        $requests = [
            'Update my contact number to +628123456789',
            'I have changed my home address to 742 Evergreen Terrace',
            'Requesting a correction for my check-in time yesterday',
            'Seeking permission for early leave next Wednesday',
            'Update my institutional email address'
        ];

        for ($i = 0; $i < 10; $i++) {
            $pid = $allProfileIds[rand(0, count($allProfileIds)-1)];
            ProfileRequest::create([
                'id' => (string)(1000 + $i),
                'profile_id' => $pid,
                'description' => $requests[rand(0, count($requests)-1)],
                'date' => Carbon::now()->subDays(rand(1, 5))->setTime(rand(9, 17), rand(0, 59)),
                'status' => ['Pending', 'Resolved', 'Rejected'][rand(0, 2)],
            ]);
        }

        echo "Seeding Historical Attendance (Last 21 days)...\n";
        for ($d = 0; $d < 21; $d++) {
            $date = Carbon::now()->subDays($d);
            if ($date->dayOfWeek === Carbon::SUNDAY) continue;

            $dateStr = $date->format('Y-m-d');
            $attendanceBatch = [];

            foreach ($allProfileIds as $pid) {
                $rand = rand(1, 100);
                if ($rand <= 5) continue; 
                
                if ($rand <= 15) {
                    $status = 'Absent';
                    $checkIn = null;
                    $checkOut = null;
                } elseif ($rand <= 20) {
                    $status = 'On Leave';
                    $checkIn = null;
                    $checkOut = null;
                } else {
                    $isLate = rand(1, 100) <= 20;
                    $status = $isLate ? 'Late' : 'Present';
                    $h = $isLate ? 8 : 7;
                    $m = $isLate ? rand(31, 59) : rand(30, 59);
                    $checkIn = sprintf("%02d:%02d", $h, $m);
                    $checkOut = "16:" . str_pad(rand(0, 30), 2, '0', STR_PAD_LEFT);
                }

                $attendanceBatch[] = [
                    'id' => $pid . '-' . $dateStr,
                    'profile_id' => $pid,
                    'date' => $dateStr,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'status' => $status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (!empty($attendanceBatch)) {
                Attendance::insert($attendanceBatch);
            }
        }

        echo "Dummy data seeding completed!\n";
    }
}
