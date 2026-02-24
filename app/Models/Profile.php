<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'role',
        'department',
        'avatar',
        'email',
        'join_date',
        'phone_number',
        'address',
        'status',
        'student_id',
        'teacher_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
