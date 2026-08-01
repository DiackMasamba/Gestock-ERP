<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Journalier extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule', 'qr_token', 'nom', 'prenom',
        'telephone', 'photo_path', 'taux_journalier', 'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'taux_journalier' => 'decimal:2',
    ];

    /**
     * Génère automatiquement un qr_token unique à la création s'il manque.
     */
    protected static function booted(): void
    {
        static::creating(function (Journalier $journalier) {
            if (empty($journalier->qr_token)) {
                $journalier->qr_token = (string) Str::ulid();
            }
        });
    }

    public function pointages(): HasMany
    {
        return $this->hasMany(Pointage::class);
    }

    public function getNomCompletAttribute(): string
    {
        return trim("{$this->prenom} {$this->nom}");
    }
}
