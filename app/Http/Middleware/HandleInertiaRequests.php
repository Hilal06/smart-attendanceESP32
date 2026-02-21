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

        if ($role === 'admin') {
            $user = \Illuminate\Support\Facades\Auth::user();
            if ($user) {
                $authData['user'] = [
                    'name' => 'Administrator',
                    'role' => 'Administrator',
                    'avatar' => null,
                ];
            }
        } elseif ($role === 'attendance') {
            $userId = session('userId');
            if ($userId) {
                $employee = \App\Models\Employee::find($userId);
                if ($employee) {
                    $authData['user'] = [
                        'name' => $employee->name,
                        'role' => $employee->role,
                        'avatar' => $employee->avatar ?: 'https://ui-avatars.com/api/?name=' . urlencode($employee->name) . '&background=random',
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
