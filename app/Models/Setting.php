<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'company_name',
        'company_logo',
        'late_threshold_minutes',
        'weekly_schedule',
        'language',
    ];

    protected $casts = [
        'weekly_schedule' => 'array',
    ];
}
