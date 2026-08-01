<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chantier extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'code', 'adresse', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    public function pointages(): HasMany
    {
        return $this->hasMany(Pointage::class);
    }
}
