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
        try {
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
                'class' => 'nullable|string|max:100',
                'age' => 'nullable|integer|min:0|max:150',
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
                    'class' => $user->role === 'student' ? ($validated['class'] ?? null) : null,
                    'age' => $validated['age'] ?? null,
                ]);
            });

            if ($user) {
                \Illuminate\Support\Facades\Auth::login($user);
                $request->session()->regenerate();
                session(['userRole' => $user->role, 'userId' => $profileId]);

                return redirect()->route('dashboard');
            }

            return back()->withErrors(['message' => 'Pendaftaran akun gagal.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error during registration: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Terjadi kesalahan saat pendaftaran: ' . $e->getMessage()]);
        }
    }

    public function authenticate(Request $request)
    {
        try {
            $request->validate([
                'email' => ['required', 'email'],
                'password' => ['required'],
            ]);

            $credentials = $request->only('email', 'password');

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
                'email' => 'Kredensial yang dimasukkan tidak cocok dengan catatan kami.',
            ])->onlyInput('email');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error during authentication: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['email' => 'Terjadi kesalahan sistem saat proses masuk: ' . $e->getMessage()])->onlyInput('email');
        }
    }

    public function logout(Request $request)
    {
        try {
            \Illuminate\Support\Facades\Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            session()->forget(['userRole', 'userId']);
            return redirect()->route('login');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error during logout: ' . $e->getMessage());
            return redirect()->route('login');
        }
    }

    // --- App Methods ---

    public function dashboard()
    {
        $settings = Setting::first();

        // Auto-seed: Removed to allow real ESP32 data to populate the attendance table.

        // Performance Optimization: 
        // 1. Only fetch active profiles with necessary fields
        // 2. Only fetch attendance for the last 40 days (enough for Month view + buffer)
        $msgDateLimit = now()->setTimezone('Asia/Jakarta')->subDays(40)->format('Y-m-d');

        $userRole = session('userRole');
        $userProfileId = session('profileId');

        $profilesQuery = Profile::select('id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status', 'class', 'age');

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
                    'class' => $emp->class,
                    'age' => $emp->age,
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
            ->select('id', 'user_id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status', 'class', 'age')
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
                    'class' => $emp->class,
                    'age' => $emp->age,
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
            ->select('id', 'user_id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status', 'class', 'age')
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
                    'class' => $emp->class,
                    'age' => $emp->age,
                    'canChangePassword' => $emp->user ? $emp->user->can_change_password : false,
                ];
            })
        ]);
    }

    public function updateSettings(Request $request)
    {
        try {
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
            return back()->with('message', 'Pengaturan berhasil diperbarui.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error updating settings: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal memperbarui pengaturan: ' . $e->getMessage()]);
        }
    }

    public function storeProfile(Request $request)
    {
        try {
            $userRole = session('userRole');
            if (!in_array($userRole, ['admin', 'teacher'])) {
                return back()->withErrors(['message' => 'Unauthorized action.']);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
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
                'class' => 'nullable|string|max:100',
                'age' => 'nullable|integer|min:0|max:150',
                'avatar' => 'nullable', // Allow either image upload or string URL backwards
                'face_data' => 'nullable', // Allow empty or file
                'password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                \Illuminate\Support\Facades\Log::error('Store Profile Validation Failed:', $validator->errors()->toArray());
                return back()->withErrors($validator)->withInput();
            }
            $validated = $validator->validated();

            if ($userRole === 'teacher' && strtolower($validated['role']) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only manage student profiles.']);
            }

            $data = $request->all();
            if (isset($validated['joinDate']))
                $data['join_date'] = $validated['joinDate'];
            if (isset($validated['phoneNumber']))
                $data['phone_number'] = $validated['phoneNumber'];

            if (strtolower($validated['role']) !== 'student') {
                $data['class'] = null; // Ensure class is only for students
            }

            if (empty($data['id'])) {
                $data['id'] = (string) rand(100000, 999999);
            }

            unset($data['password']);
            unset($data['password_confirmation']);

            \Illuminate\Support\Facades\DB::transaction(function () use (&$data, $validated, $request) {
                $user = \App\Models\User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => \Illuminate\Support\Facades\Hash::make(!empty($validated['password']) ? $validated['password'] : 'password123'),
                    'role' => strtolower($validated['role']),
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

            $faceRegistrationMessage = null;
            // Handle Face Data Upload outside DB transaction since it calls external API
            if ($request->hasFile('face_data')) {
                $registrationResult = $this->registerFaceData($data['id'], $request->file('face_data'));
                if (!$registrationResult['success']) {
                    $faceRegistrationMessage = $registrationResult['message'];
                }
            }

            $msg = 'Profil berhasil ditambahkan';
            if (empty($validated['password'])) {
                $msg .= ' dengan kata sandi bawaan "password123".';
            } else {
                $msg .= '.';
            }

            if ($faceRegistrationMessage) {
                $msg .= ' Catatan: registrasi wajah gagal: ' . $faceRegistrationMessage;
            }

            return back()->with('message', $msg);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error storing profile: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal menyimpan profil: ' . $e->getMessage()])->withInput();
        }
    }

    public function updateProfile(Request $request, $id)
    {
        try {
            $userRole = session('userRole');
            if (!in_array($userRole, ['admin', 'teacher'])) {
                return back()->withErrors(['message' => 'Unauthorized action.']);
            }

            $profile = Profile::with('user')->find($id);
            if (!$profile) {
                return back()->withErrors(['message' => 'Profil tidak ditemukan.']);
            }

            if ($userRole === 'teacher' && strtolower($profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only manage student profiles.']);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
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
                'student_id' => [
                    'nullable',
                    'string',
                    'max:20',
                    \Illuminate\Validation\Rule::unique('profiles')->ignore($profile->id)
                ],
                'teacher_id' => [
                    'nullable',
                    'string',
                    'max:20',
                    \Illuminate\Validation\Rule::unique('profiles')->ignore($profile->id)
                ],
                'class' => 'nullable|string|max:100',
                'age' => 'nullable|integer|min:0|max:150',
                'avatar' => 'nullable',
                'face_data' => 'nullable',
                'password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                \Illuminate\Support\Facades\Log::error('Update Profile Validation Failed:', $validator->errors()->toArray());
                return back()->withErrors($validator)->withInput();
            }
            $validated = $validator->validated();

            if ($userRole === 'teacher' && strtolower($validated['role']) !== 'student') {
                return back()->withErrors(['message' => 'Teachers cannot change a student into another role.']);
            }

            $data = $request->all();
            if (isset($validated['joinDate']))
                $data['join_date'] = $validated['joinDate'];
            if (isset($validated['phoneNumber']))
                $data['phone_number'] = $validated['phoneNumber'];

            if (strtolower($validated['role']) !== 'student') {
                $data['class'] = null;
            }

            unset($data['password']);
            unset($data['password_confirmation']);

            \Illuminate\Support\Facades\DB::transaction(function () use (&$data, $profile, $validated, $request) {
                if ($profile->user) {
                    $updateData = [
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'role' => strtolower($validated['role']),
                    ];

                    if (!empty($validated['password'])) {
                        $updateData['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
                    }

                    $profile->user->update($updateData);

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

            $faceRegistrationMessage = null;
            if ($request->hasFile('face_data')) {
                $registrationResult = $this->registerFaceData($profile->id, $request->file('face_data'));
                if (!$registrationResult['success']) {
                    $faceRegistrationMessage = $registrationResult['message'];
                }
            }

            $msg = 'Profil berhasil diperbarui.';
            if ($faceRegistrationMessage) {
                $msg .= ' Namun registrasi wajah gagal: ' . $faceRegistrationMessage;
            }

            return back()->with('message', $msg);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error updating profile: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal memperbarui profil: ' . $e->getMessage()])->withInput();
        }
    }

    public function togglePasswordPermission($id)
    {
        try {
            $userRole = session('userRole');
            if (!in_array($userRole, ['admin', 'teacher'])) {
                return back()->withErrors(['message' => 'Unauthorized action.']);
            }

            $profile = Profile::with('user')->find($id);

            if (!$profile || !$profile->user) {
                return back()->withErrors(['message' => 'Profil atau akun pengguna tidak ditemukan.']);
            }

            if ($userRole === 'teacher' && strtolower($profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Teachers can only manage student permissions.']);
            }

            $profile->user->can_change_password = !$profile->user->can_change_password;
            $profile->user->save();

            return back()->with('message', 'Izin kata sandi berhasil diperbarui.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error toggling password permission: ' . $e->getMessage());
            return back()->withErrors(['message' => 'Gagal mengubah izin kata sandi: ' . $e->getMessage()]);
        }
    }

    public function deleteProfile($id)
    {
        try {
            $userRole = session('userRole');
            if (!in_array($userRole, ['admin', 'teacher'])) {
                return back()->withErrors(['message' => 'Unauthorized action.']);
            }

            $profile = Profile::find($id);
            if (!$profile) {
                return back()->withErrors(['message' => 'Profil tidak ditemukan.']);
            }

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

            return back()->with('message', 'Profil berhasil dihapus.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting profile: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal menghapus profil: ' . $e->getMessage()]);
        }
    }

    public function reports()
    {
        $settings = Setting::first();
        $attendances = Attendance::select('id', 'profile_id', 'date', 'check_in', 'check_out', 'status')->get();
        $profiles = Profile::select('id', 'name', 'role', 'department', 'avatar', 'email', 'join_date', 'phone_number', 'address', 'status', 'class', 'age')->get();

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
                    'class' => $emp->class,
                    'age' => $emp->age,
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
        try {
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
                return back()->withErrors(['current_password' => 'Kata sandi saat ini tidak sesuai.']);
            }

            /** @var \App\Models\User $user */
            $user->name = $request->name;
            $user->email = $request->email;

            if ($request->filled('new_password')) {
                $user->password = \Illuminate\Support\Facades\Hash::make($request->new_password);
            }

            $user->save();

            return back()->with('message', 'Kredensial admin berhasil diperbarui.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error updating admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal memperbarui kredensial: ' . $e->getMessage()]);
        }
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
        try {
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
            return back()->with('message', 'Pengumuman berhasil dipublikasikan.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error storing announcement: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal membuat pengumuman: ' . $e->getMessage()])->withInput();
        }
    }

    public function updateAnnouncement(Request $request, $id)
    {
        try {
            if (session('userRole') !== 'admin') {
                return back()->withErrors(['message' => 'Unauthorized action.']);
            }

            $announcement = Announcement::find($id);
            if (!$announcement) {
                return back()->withErrors(['message' => 'Pengumuman tidak ditemukan.']);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'priority' => 'required|string|max:50',
                'date' => 'required|date',
            ]);

            $announcement->update($validated);
            return back()->with('message', 'Pengumuman berhasil diperbarui.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error updating announcement: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal memperbarui pengumuman: ' . $e->getMessage()])->withInput();
        }
    }

    public function deleteAnnouncement($id)
    {
        try {
            if (session('userRole') !== 'admin') {
                return back()->withErrors(['message' => 'Unauthorized action.']);
            }

            $announcement = Announcement::find($id);
            if (!$announcement) {
                return back()->withErrors(['message' => 'Pengumuman tidak ditemukan.']);
            }

            $announcement->delete();
            return back()->with('message', 'Pengumuman berhasil dihapus.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting announcement: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal menghapus pengumuman: ' . $e->getMessage()]);
        }
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
        try {
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
            return back()->with('message', 'Permohonan berhasil diajukan.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error storing request: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal mengajukan permohonan: ' . $e->getMessage()]);
        }
    }

    public function updateRequest(Request $request, $id)
    {
        try {
            if (!in_array(session('userRole'), ['admin', 'teacher'])) {
                return back()->withErrors(['message' => 'Aksi tidak diizinkan.']);
            }

            $req = ProfileRequest::with('profile')->find($id);
            if (!$req) {
                return back()->withErrors(['message' => 'Permohonan tidak ditemukan.']);
            }

            if (session('userRole') === 'teacher' && strtolower($req->profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Guru hanya dapat mengelola permohonan siswa.']);
            }
            $validated = $request->validate([
                'status' => 'required|string|in:Pending,Approved,Rejected',
            ]);
            // Frontend sends status updates
            $req->update($validated);
            return back()->with('message', 'Status permohonan berhasil diperbarui.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error updating request: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal memperbarui permohonan: ' . $e->getMessage()]);
        }
    }

    public function deleteRequest($id)
    {
        try {
            if (!in_array(session('userRole'), ['admin', 'teacher'])) {
                return back()->withErrors(['message' => 'Aksi tidak diizinkan.']);
            }

            $req = ProfileRequest::with('profile')->find($id);
            if (!$req) {
                return back()->withErrors(['message' => 'Permohonan tidak ditemukan.']);
            }

            if (session('userRole') === 'teacher' && strtolower($req->profile->role) !== 'student') {
                return back()->withErrors(['message' => 'Guru hanya dapat menghapus permohonan siswa.']);
            }
            $req->delete();
            return back()->with('message', 'Permohonan berhasil dihapus.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting request: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal menghapus permohonan: ' . $e->getMessage()]);
        }
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
                'class' => $primaryProfile->class,
                'age' => $primaryProfile->age,
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
        try {
            $user = \Illuminate\Support\Facades\Auth::user();

            if (!$user) {
                return back()->withErrors(['message' => 'Pengguna tidak ditemukan.']);
            }

            $request->validate([
                'current_password' => ['required', 'string'],
                'new_password' => ['required', 'string', 'min:8', 'confirmed'],
            ]);

            if (strtolower($user->role) === 'student' && !$user->can_change_password) {
                return back()->withErrors(['message' => 'Anda tidak memiliki izin untuk mengubah kata sandi.']);
            }

            if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
                return back()->withErrors(['current_password' => 'Kata sandi saat ini tidak cocok.']);
            }

            /** @var \App\Models\User $user */
            $user->password = \Illuminate\Support\Facades\Hash::make($request->new_password);

            if (strtolower($user->role) === 'student') {
                $user->can_change_password = false;
            }

            $user->save();

            return back()->with('message', 'Kata sandi berhasil diperbarui.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error updating profile password: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['message' => 'Gagal memperbarui kata sandi: ' . $e->getMessage()]);
        }
    }

    // --- API Methods for ESP32 ---

    public function storeAttendanceApi(Request $request)
    {
        try {
            // Simple API Key Validation
            $expectedKey = config('services.python_service.api_key', env('API_KEY', '1234567890'));
            $providedKey = $request->header('X-API-KEY');

            if ($providedKey !== $expectedKey) {
                return response()->json(['status' => 'error', 'message' => 'Tidak sah. Kunci API tidak valid.'], 401);
            }

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
                    'message' => 'Sampai jumpa! Check-out tercatat pada ' . $timeString,
                    'data' => $attendance
                ]);
            } else {
                // Check In
                $status = 'Present';

                // Dynamic Late Calculation based on Settings
                $settings = Setting::first();
                if ($settings && $settings->weekly_schedule) {
                    $dayOfWeek = $now->format('l'); // e.g. "Monday"
                    $schedule = is_string($settings->weekly_schedule) ? json_decode($settings->weekly_schedule, true) : $settings->weekly_schedule;

                    $todaySchedule = collect($schedule)->firstWhere('day', $dayOfWeek);

                    if ($todaySchedule && !empty($todaySchedule['isActive']) && !empty($todaySchedule['start'])) {
                        // Start time is like "08:00"
                        $startTimeParts = explode(':', $todaySchedule['start']);
                        $startHour = (int)$startTimeParts[0];
                        $startMinute = (int)$startTimeParts[1];

                        $threshold = $settings->late_threshold_minutes ?? 0;

                        // Create Carbon instance for the threshold time today
                        $lateTime = $now->copy()->setTime($startHour, $startMinute)->addMinutes($threshold);

                        if ($now->greaterThan($lateTime)) {
                            $status = 'Late';
                        }
                    }
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
                    'message' => 'Selamat datang! Check-in tercatat pada ' . $timeString,
                    'data' => $attendance
                ]);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data tidak valid: ' . implode(', ', array_map(fn($err) => implode(', ', $err), $e->errors())),
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error storing attendance via API: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mencatat presensi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function systemStatus()
    {
        try {
            $microserviceUrl = config('services.python_service.url', 'http://127.0.0.1:5000');
            $response = \Illuminate\Support\Facades\Http::timeout(3)->get($microserviceUrl . '/health');

            if ($response->successful()) {
                $data = $response->json();
                $faceRecAvailable = !empty($data['face_rec_available']);
                $isOnline = ($data['status'] ?? '') === 'online' && $faceRecAvailable;

                return response()->json([
                    'status' => $isOnline ? 'online' : 'offline',
                    'face_rec_available' => $faceRecAvailable,
                    'loaded_faces_count' => $data['loaded_faces_count'] ?? 0,
                    'message' => $isOnline ? 'Layanan pengenalan wajah aktif.' : 'Mesin pengenalan wajah offline atau tidak tersedia.'
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Layanan pengenalan wajah tidak dapat diakses: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'offline',
            'face_rec_available' => false,
            'loaded_faces_count' => 0,
            'message' => 'Layanan pengenalan wajah offline atau terputus.'
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

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Face registered successfully.'];
            } else {
                \Illuminate\Support\Facades\Log::error('Failed to register face data: ' . $response->body());
                $errorBody = json_decode($response->body(), true);
                $errorMessage = isset($errorBody['message']) ? $errorBody['message'] : 'The face recognition service returned an error.';
                return ['success' => false, 'message' => $errorMessage];
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception registering face data: ' . $e->getMessage());
            return ['success' => false, 'message' => 'The face recognition microservice is offline or unreachable.'];
        }
    }
}
