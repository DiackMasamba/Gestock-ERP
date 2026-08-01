<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PointageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date?->toDateString(),
            'heure_arrivee' => $this->heure_arrivee?->toIso8601String(),
            'heure_depart' => $this->heure_depart?->toIso8601String(),
            'statut' => $this->statut,
            'source' => $this->source,
            'journalier' => new JournalierResource($this->whenLoaded('journalier')),
            'chantier' => [
                'id' => $this->chantier?->id,
                'nom' => $this->chantier?->nom,
                'code' => $this->chantier?->code,
            ],
        ];
    }
}
