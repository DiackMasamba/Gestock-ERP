<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pointage extends Model
{
    use HasFactory;

    protected $fillable = [
        'journalier_id', 'chantier_id', 'pointe_par', 'date',
        'heure_arrivee', 'heure_depart', 'statut', 'source',
    ];

    protected $casts = [
        'date' => 'date',
        'heure_arrivee' => 'datetime',
        'heure_depart' => 'datetime',
    ];

    public function journalier(): BelongsTo
    {
        return $this->belongsTo(Journalier::class);
    }

    public function chantier(): BelongsTo
    {
        return $this->belongsTo(Chantier::class);
    }

    public function operateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pointe_par');
    }
}
