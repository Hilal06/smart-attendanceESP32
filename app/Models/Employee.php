<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'role',
        'department',
        'avatar',
        'email',
        'join_date',
        'phone_number',
        'address',
        'status',
    ];
}
