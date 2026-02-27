<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'manage settings',
            'manage users',
            'manage roles', // For future super-admin scaling
            'manage attendance',
            'view all reports',
            'post announcements',
            'approve requests',
            'view own attendance',
            'submit requests',
            'manage students',
        ];

        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permission]);
        }

        // Create Roles and assign created permissions

        // 1. Admin Role (Has all permissions natively or via gate - we assign explicit here for clarity)
        $adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(\Spatie\Permission\Models\Permission::all());

        // 2. Teacher Role
        $teacherRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'teacher']);
        $teacherRole->givePermissionTo([
            'manage attendance',
            'post announcements',
            'approve requests',
            'view own attendance',
            'submit requests',
            'manage students',
        ]);

        // 3. Student Role
        $studentRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student']);
        $studentRole->givePermissionTo([
            'view own attendance',
            'submit requests',
        ]);

        // Optional: Assign admin role to the first user if they exist
        $firstUser = \App\Models\User::find(1);
        if ($firstUser) {
            // Ensure the user role column matches the spatie role to avoid conflicts during transition
            $firstUser->update(['role' => 'super_admin']);
            $firstUser->assignRole('admin');
        }
    }
}
