<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileRequest extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'profile_id',
        'description',
        'date',
        'status',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}
