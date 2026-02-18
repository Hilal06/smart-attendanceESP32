<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'status',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
