<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $role = session('userRole');
        $authData = [
            'role' => $role,
            'user' => null
        ];

        // Fetch permissions if user is fully authenticated
        $permissions = [];
        $user = \Illuminate\Support\Facades\Auth::user();
        if ($user) {
            // Spatie method to grab all direct and role-based permissions
            $permissions = $user->getAllPermissions()->pluck('name')->toArray();
            
            // Sync session role fallback to actual user role if unset
            if (!$role) {
                $role = $user->role;
            }
        }

        if ($role === 'admin') {
            if ($user) {
                $authData['user'] = [
                    'name' => 'Administrator',
                    'role' => 'Administrator',
                    'avatar' => null,
                    'permissions' => $permissions,
                ];
            }
        } elseif ($role === 'attendance' || in_array($role, ['teacher', 'student'])) {
            $userId = session('userId');
            if ($userId) {
                $profile = \App\Models\Profile::find($userId);
                if ($profile) {
                    $authData['user'] = [
                        'name' => $profile->name,
                        'role' => $profile->role,
                        'avatar' => $profile->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($profile->name) . '&background=random',
                        'permissions' => $permissions,
                    ];
                }
            }
        }

        return [
            ...parent::share($request),
            'auth' => $authData,
        ];
    }
}
