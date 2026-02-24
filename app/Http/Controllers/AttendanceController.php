<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Profile;
use App\Models\Attendance;
use App\Models\Announcement;
use App\Models\ProfileRequest;
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
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
        ]);
    }

    public function registerPage()
    {
        if (session('userRole')) {
            return redirect()->route('dashboard');
        }
        $settings = Setting::first();
        return Inertia::render('Register', [
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->where(function ($query) use ($request) {
                    return $query->where('role', $request->role);
                })
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                \Illuminate\Validation\Rules\Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'role' => 'required|in:student,teacher',
            'department' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'institutional_id' => 'nullable|string|max:20',
        ]);

        $user = null;
        $profileId = (string) rand(100000, 999999);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, &$user, $profileId) {
            $user = \App\Models\User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
                'role' => $validated['role'],
            ]);

            // Assign Spatie Role
            $user->assignRole(strtolower($validated['role']));

            \App\Models\Profile::create([
                'id' => $profileId,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => ucfirst($user->role),
                'department' => $validated['department'] ?? 'General',
                'phone_number' => $validated['phone_number'] ?? null,
                'address' => $validated['address'] ?? null,
                'student_id' => $user->role === 'student' ? ($validated['institutional_id'] ?? null) : null,
                'teacher_id' => $user->role === 'teacher' ? ($validated['institutional_id'] ?? null) : null,
                'join_date' => now()->format('Y-m-d'),
                'status' => 'Active',
            ]);
        });

        if ($user) {
            \Illuminate\Support\Facades\Auth::login($user);
            $request->session()->regenerate();
            session(['userRole' => $user->role, 'userId' => $profileId]);

            return redirect()->route('dashboard');
        }

        return back()->withErrors(['message' => 'Registration failed.']);
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
            'role' => ['required', 'string'],
        ]);

        if (\Illuminate\Support\Facades\Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = \Illuminate\Support\Facades\Auth::user();

            // Map legacy user (user ID 1) or 'super_admin' to 'admin'
            $frontendRole = $user->role;
            if ($user->id === 1 || $user->role === 'super_admin') {
                $frontendRole = 'admin';
            }

            $profile = \App\Models\Profile::where('user_id', $user->id)->first();
            // Fallback to legacy behavior if no profile record is linked
            $userId = $profile ? $profile->id : 'admin';

            session(['userRole' => $frontendRole, 'userId' => $userId]);

            return to_route('dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
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
            $profiles = Profile::where('status', '!=', 'Terminated')->get();
            $insertData = [];
            foreach ($profiles as $emp) {
                if (rand(1, 100) <= 15) {
                    $status = rand(0, 1) ? 'Absent' : 'On Leave';
                    $insertData[] = [
                        'id' => $emp->id . '-' . $today,
                        'profile_id' => $emp->id,
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
                    'profile_id' => $emp->id,
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
        // 1. Only fetch active profiles with necessary fields
        // 2. Only fetch attendance for the last 40 days (enough for Month view + buffer)
        $msgDateLimit = now()->setTimezone('Asia/Jakarta')->subDays(40)->format('Y-m-d');

        $userRole = session('userRole');
        $userProfileId = session('profileId');

        $profilesQuery = Profile::select('id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status');

        if ($userRole === 'teacher') {
            $profilesQuery->whereRaw('LOWER(role) = ?', ['student']);
        } elseif ($userRole === 'student') {
            $profilesQuery->where('id', $userProfileId);
        }

        $profiles = $profilesQuery->get();
        // Pluck IDs to easily filter attendances
        $profileIds = $profiles->pluck('id')->toArray();

        $attendances = Attendance::where('date', '>=', $msgDateLimit)
            ->whereIn('profile_id', $profileIds)
            ->orderBy('date', 'desc')
            ->orderBy('check_in', 'desc')
            ->select('id', 'profile_id', 'date', 'check_in', 'check_out', 'status')
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
            'profiles' => $profiles->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role,
                    'department' => $emp->department,
                    'avatar' => $emp->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($emp->name) . '&background=random',
                    // Nullifying unnecessary fields to reduce Dashboard JSON payload
                    'email' => null,
                    'joinDate' => null,
                    'phoneNumber' => null,
                    'address' => null,
                    'status' => $emp->status,
                ];
            }),
            'attendance' => $attendances->map(function ($att) {
                return [
                    'id' => $att->id,
                    'profileId' => $att->profile_id,
                    'date' => $att->date,
                    'checkIn' => $att->check_in,
                    'checkOut' => $att->check_out,
                    'status' => $att->status,
                ];
            }),
            'announcements' => Announcement::orderBy('date', 'desc')->limit(10)->get()
        ]);
    }

    public function profiles()
    {
        if (session('userRole') !== 'admin') {
            return redirect('/')->withErrors(['message' => 'Unauthorized action.']);
        }

        $settings = Setting::first();
        $profiles = Profile::with('user')->whereRaw('LOWER(role) != ?', ['student'])
            ->select('id', 'user_id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status')
            ->get();
        return Inertia::render('Profiles', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'profiles' => $profiles->map(function ($emp) {
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
                    'canChangePassword' => $emp->user ? $emp->user->can_change_password : false,
                ];
            })
        ]);
    }

    public function students()
    {
        if (!in_array(session('userRole'), ['admin', 'teacher'])) {
            return redirect('/')->withErrors(['message' => 'Unauthorized action.']);
        }

        $settings = Setting::first();
        $profiles = Profile::with('user')->whereRaw('LOWER(role) = ?', ['student'])
            ->select('id', 'user_id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status')
            ->get();
        return Inertia::render('Students', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'profiles' => $profiles->map(function ($emp) {
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
                    'canChangePassword' => $emp->user ? $emp->user->can_change_password : false,
                ];
            })
        ]);
    }

    public function updateSettings(Request $request)
    {
        if (session('userRole') !== 'admin') {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $data = $request->all();
        // Map camelCase to snake_case
        $updateData = [];
        if (isset($data['companyName']))
            $updateData['company_name'] = $data['companyName'];
        if (isset($data['lateThresholdMinutes']))
            $updateData['late_threshold_minutes'] = $data['lateThresholdMinutes'];
        if (isset($data['weeklySchedule']))
            $updateData['weekly_schedule'] = $data['weeklySchedule'];
        if (isset($data['language']))
            $updateData['language'] = $data['language'];

        if (array_key_exists('companyLogo', $data)) {
            $logoData = $data['companyLogo'];

            if (empty($logoData)) {
                $updateData['company_logo'] = null;
            } else {
                // If it's a base64 string (from FileReader)
                if (preg_match('/^data:image\/(\w+);base64,/', $logoData, $type)) {
                    $logoData = substr($logoData, strpos($logoData, ',') + 1);
                    $type = strtolower($type[1]); // jpg, png, gif

                    if (in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                        $logoData = base64_decode($logoData);
                        if ($logoData !== false) {
                            $filename = 'company_logo_' . time() . '.' . $type;
                            Storage::disk('public')->put('logos/' . $filename, $logoData);
                            $updateData['company_logo'] = Storage::url('logos/' . $filename);
                        }
                    }
                } else {
                    // It might be already a URL
                    $updateData['company_logo'] = $logoData;
                }
            }
        }

        $settings = Setting::first();
        if ($settings) {
            $settings->update($updateData);
        } else {
            Setting::create($updateData);
        }
        return back()->with('message', 'Settings updated successfully');
    }

    public function storeProfile(Request $request)
    {
        $userRole = session('userRole');
        if (!in_array($userRole, ['admin', 'teacher'])) {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->where(function ($query) use ($request) {
                    return $query->where('role', $request->role);
                })
            ],
            'department' => 'nullable|string|max:255',
            'joinDate' => 'nullable|date',
            'phoneNumber' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'nullable|string',
            'student_id' => 'nullable|string|max:20',
            'teacher_id' => 'nullable|string|max:20',
            'avatar' => 'nullable|image|max:2048', // 2MB max
            'face_data' => 'nullable|file|max:5120', // 5MB max
        ]);

        if ($userRole === 'teacher' && strtolower($validated['role']) !== 'student') {
            return back()->withErrors(['message' => 'Teachers can only manage student profiles.']);
        }

        $data = $request->all();
        if (isset($validated['joinDate']))
            $data['join_date'] = $validated['joinDate'];
        if (isset($validated['phoneNumber']))
            $data['phone_number'] = $validated['phoneNumber'];

        if (empty($data['id'])) {
            $data['id'] = (string) rand(100000, 999999);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use (&$data, $validated, $request) {
            $user = \App\Models\User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => \Illuminate\Support\Facades\Hash::make('password123'), // Default password
                'role' => $validated['role'],
            ]);

            // Assign Spatie Role
            $user->assignRole(strtolower($validated['role']));

            $data['user_id'] = $user->id;

            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                $filename = $data['id'] . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('avatars', $filename, 'public');
                $data['avatar'] = \Illuminate\Support\Facades\Storage::url($path);
            }

            Profile::create($data);
        });

        // Handle Face Data Upload outside DB transaction since it calls external API
        if ($request->hasFile('face_data')) {
            $this->registerFaceData($data['id'], $request->file('face_data'));
        }

        return back()->with('message', 'Profile created successfully with default password "password123".');
    }

    public function updateProfile(Request $request, $id)
    {
        $userRole = session('userRole');
        if (!in_array($userRole, ['admin', 'teacher'])) {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $profile = Profile::with('user')->find($id);
        if ($profile) {
            if ($userRole === 'teacher' && strtolower($profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only manage student profiles.']);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'role' => 'required|string',
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    \Illuminate\Validation\Rule::unique('users')->where(function ($query) use ($request) {
                        return $query->where('role', $request->role);
                    })->ignore($profile->user_id)
                ],
                'department' => 'nullable|string|max:255',
                'joinDate' => 'nullable|date',
                'phoneNumber' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'status' => 'nullable|string',
                'student_id' => 'nullable|string|max:20',
                'teacher_id' => 'nullable|string|max:20',
                'avatar' => 'nullable|image|max:2048',
                'face_data' => 'nullable|file|max:5120',
            ]);

            if ($userRole === 'teacher' && strtolower($validated['role']) !== 'student') {
                return back()->withErrors(['message' => 'Teachers cannot change a student into another role.']);
            }

            $data = $request->all();
            if (isset($validated['joinDate']))
                $data['join_date'] = $validated['joinDate'];
            if (isset($validated['phoneNumber']))
                $data['phone_number'] = $validated['phoneNumber'];

            \Illuminate\Support\Facades\DB::transaction(function () use (&$data, $profile, $validated, $request) {
                if ($profile->user) {
                    $profile->user->update([
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'role' => $validated['role'],
                    ]);

                    // Sync Spatie Role
                    $profile->user->syncRoles([strtolower($validated['role'])]);
                }

                if ($request->hasFile('avatar')) {
                    if ($profile->avatar && str_contains($profile->avatar, '/storage/')) {
                        $oldPath = str_replace('/storage/', '', $profile->avatar);
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                    }
                    $file = $request->file('avatar');
                    $filename = $profile->id . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('avatars', $filename, 'public');
                    $data['avatar'] = \Illuminate\Support\Facades\Storage::url($path);
                }

                $profile->update($data);
            });

            if ($request->hasFile('face_data')) {
                $this->registerFaceData($profile->id, $request->file('face_data'));
            }
        }
        return back()->with('message', 'Profile updated successfully.');
    }

    public function togglePasswordPermission($id)
    {
        $userRole = session('userRole');
        if (!in_array($userRole, ['admin', 'teacher'])) {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $profile = Profile::with('user')->find($id);

        if (!$profile || !$profile->user) {
            return back()->withErrors(['message' => 'Profile or associated user not found.']);
        }

        if ($userRole === 'teacher' && strtolower($profile->role) !== 'student') {
            return back()->withErrors(['message' => 'Teachers can only manage student permissions.']);
        }

        $profile->user->can_change_password = !$profile->user->can_change_password;
        $profile->user->save();

        return back()->with('message', 'Password permission updated successfully.');
    }

    public function deleteProfile($id)
    {
        $userRole = session('userRole');
        if (!in_array($userRole, ['admin', 'teacher'])) {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $profile = Profile::find($id);
        if ($profile) {
            if ($userRole === 'teacher' && strtolower($profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only delete student profiles.']);
            }

            \Illuminate\Support\Facades\DB::transaction(function () use ($profile) {
                if ($profile->avatar && str_contains($profile->avatar, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $profile->avatar);
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                }

                $userId = $profile->user_id;
                $profile->delete();

                if ($userId) {
                    \App\Models\User::destroy($userId);
                }
            });
        }

        return back()->with('message', 'Profile deleted successfully.');
    }

    public function reports()
    {
        $settings = Setting::first();
        $attendances = Attendance::select('id', 'profile_id', 'date', 'check_in', 'check_out', 'status')->get();
        $profiles = Profile::select('id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status')->get();

        return Inertia::render('Reports', [
            'userRole' => session('userRole'),
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null,
            'attendance' => $attendances->map(function ($att) {
                return [
                    'id' => $att->id,
                    'profileId' => $att->profile_id,
                    'date' => $att->date,
                    'checkIn' => $att->check_in,
                    'checkOut' => $att->check_out,
                    'status' => $att->status,
                ];
            }),
            'profiles' => $profiles->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role,
                    'department' => $emp->department,
                    'avatar' => $emp->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($emp->name) . '&background=random',
                    // Nullifying unnecessary fields to reduce Reports JSON payload
                    'email' => null,
                    'joinDate' => null,
                    'phoneNumber' => null,
                    'address' => null,
                    'status' => $emp->status,
                ];
            })
        ]);
    }

    public function settings()
    {
        $settings = Setting::first();
        $admin = null;
        if (session('userRole') === 'admin') {
            $user = \Illuminate\Support\Facades\Auth::user();
            if ($user) {
                $admin = [
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            }
        }

        return Inertia::render('Settings', [
            'userRole' => session('userRole'),
            'admin' => $admin,
            'settings' => $settings ? [
                'companyName' => $settings->company_name,
                'companyLogo' => $settings->company_logo,
                'lateThresholdMinutes' => $settings->late_threshold_minutes,
                'weeklySchedule' => $settings->weekly_schedule,
                'language' => $settings->language,
            ] : null
        ]);
    }

    public function updateAdmin(Request $request)
    {
        if (session('userRole') !== 'admin') {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $user = \Illuminate\Support\Facades\Auth::user();

        if (!$user) {
            return back()->withErrors(['message' => 'User not found.']);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->ignore($user->id)],
            'current_password' => ['required', 'string'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'The provided password does not match your current password.']);
        }

        /** @var \App\Models\User $user */
        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('new_password')) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->new_password);
        }

        $user->save();

        return back()->with('message', 'Admin credentials updated successfully.');
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
        if (session('userRole') !== 'admin') {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|string|max:50',
            'date' => 'required|date',
        ]);

        $data = $validated;
        if (!isset($data['id'])) {
            $data['id'] = (string) time();
        }
        Announcement::create($data);
        return back();
    }

    public function updateAnnouncement(Request $request, $id)
    {
        if (session('userRole') !== 'admin') {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $announcement = Announcement::find($id);
        if ($announcement) {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'priority' => 'required|string|max:50',
                'date' => 'required|date',
            ]);
            $announcement->update($validated);
        }
        return back();
    }

    public function deleteAnnouncement($id)
    {
        if (session('userRole') !== 'admin') {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        Announcement::destroy($id);
        return back();
    }

    public function requests()
    {
        if (!in_array(session('userRole'), ['admin', 'teacher'])) {
            return redirect('/')->withErrors(['message' => 'Unauthorized action.']);
        }

        $settings = Setting::first();

        $query = ProfileRequest::with('profile')->orderBy('date', 'desc');

        if (session('userRole') === 'teacher') {
            $query->whereHas('profile', function ($q) {
                $q->whereRaw('LOWER(role) = ?', ['student']);
            });
        }

        $requests = $query->get()->map(function ($req) {
            // Map snake_case to camelCase for frontend
            $req->profileId = $req->profile_id;
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
            'profiles' => (session('userRole') === 'teacher' ? Profile::whereRaw('LOWER(role) = ?', ['student'])->get() : Profile::all())->map(function ($emp) {
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
        $validated = $request->validate([
            'profileId' => 'required|string|exists:profiles,id',
            'description' => 'required|string',
            'date' => 'required|date',
        ]);

        $data = $validated;
        $data['id'] = (string) time();
        $data['profile_id'] = $data['profileId'];
        $data['date'] = Carbon::parse($data['date'])->setTimezone('Asia/Jakarta');
        $data['status'] = 'Pending';

        ProfileRequest::create($data);
        return back();
    }

    public function updateRequest(Request $request, $id)
    {
        if (!in_array(session('userRole'), ['admin', 'teacher'])) {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $req = ProfileRequest::with('profile')->find($id);
        if ($req) {
            if (session('userRole') === 'teacher' && strtolower($req->profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only manage student requests.']);
            }
            $validated = $request->validate([
                'status' => 'required|string|in:Pending,Approved,Rejected',
            ]);
            // Frontend sends status updates
            $req->update($validated);
        }
        return back();
    }

    public function deleteRequest($id)
    {
        if (!in_array(session('userRole'), ['admin', 'teacher'])) {
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        $req = ProfileRequest::with('profile')->find($id);
        if ($req) {
            if (session('userRole') === 'teacher' && strtolower($req->profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only delete student requests.']);
            }
            $req->delete();
        }
        return back();
    }

    public function profile()
    {
        $settings = Setting::first();
        $userId = session('userId');

        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user) {
            return redirect('/login');
        }

        $userProfiles = Profile::where('user_id', $user->id)->get();
        $profileIds = $userProfiles->pluck('id')->toArray();
        $requests = ProfileRequest::whereIn('profile_id', $profileIds)->get();

        $primaryProfile = $userProfiles->first();
        $profileData = null;
        if ($primaryProfile) {
            $profileData = [
                'id' => $primaryProfile->id,
                'name' => $primaryProfile->name,
                'role' => $primaryProfile->role,
                'department' => $primaryProfile->department,
                'avatar' => $primaryProfile->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($primaryProfile->name) . '&background=random',
                'email' => $primaryProfile->email,
                'joinDate' => $primaryProfile->join_date,
                'phoneNumber' => $primaryProfile->phone_number,
                'address' => $primaryProfile->address,
                'status' => $primaryProfile->status,
                'canChangePassword' => $user->can_change_password,
            ];
        }

        return Inertia::render('Profile', [
            'userRole' => session('userRole'),
            'settings' => Setting::first(),
            'profile' => $profileData,
            'requests' => $requests->map(function ($req) {
                return [
                    'id' => $req->id,
                    'profileId' => $req->profile_id,
                    'description' => $req->description,
                    'date' => $req->date,
                    'status' => $req->status,
                ];
            })
        ]);
    }

    public function updateProfilePassword(Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if (!$user) {
            return back()->withErrors(['message' => 'User not found.']);
        }

        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (strtolower($user->role) === 'student' && !$user->can_change_password) {
            return back()->withErrors(['message' => 'You do not have permission to change your password.']);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'The provided password does not match your current password.']);
        }

        /** @var \App\Models\User $user */
        $user->password = \Illuminate\Support\Facades\Hash::make($request->new_password);

        if (strtolower($user->role) === 'student') {
            $user->can_change_password = false;
        }

        $user->save();

        return back()->with('message', 'Password updated successfully.');
    }

    // --- API Methods for ESP32 ---

    public function storeAttendanceApi(Request $request)
    {
        $request->validate([
            'profile_id' => 'required|exists:profiles,id',
        ]);

        $profileId = $request->input('profile_id');
        $today = now()->setTimezone('Asia/Jakarta')->format('Y-m-d');
        $now = now()->setTimezone('Asia/Jakarta');
        $timeString = $now->format('H:i');

        $attendanceId = $profileId . '-' . $today;
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
                'profile_id' => $profileId,
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

    public function systemStatus()
    {
        try {
            $microserviceUrl = config('services.python_service.url', 'http://127.0.0.1:5000');
            $response = \Illuminate\Support\Facades\Http::timeout(3)->get($microserviceUrl . '/health');

            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            // Silently catch the exception to return offline status
        }

        return response()->json([
            'status' => 'offline',
            'face_rec_available' => false,
            'loaded_faces_count' => 0
        ]);
    }

    private function registerFaceData($profileId, $file)
    {
        try {
            $microserviceUrl = config('services.python_service.url', 'http://127.0.0.1:5000');

            $response = \Illuminate\Support\Facades\Http::timeout(10)->attach(
                'file',
                file_get_contents($file->getRealPath()),
                $file->getClientOriginalName()
            )->post($microserviceUrl . '/register_face', [
                        'profile_id' => $profileId,
                    ]);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error('Failed to register face data: ' . $response->body());
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception registering face data: ' . $e->getMessage());
        }
    }
}
