<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'matricule' => $this->matricule,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'nom_complet' => $this->nom_complet,
            'telephone' => $this->telephone,
            'photo_url' => $this->photo_path ? asset('storage/' . $this->photo_path) : null,
            'taux_journalier' => (float) $this->taux_journalier,
            'actif' => $this->actif,
        ];
    }
}
