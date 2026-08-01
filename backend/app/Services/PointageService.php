<?php

namespace App\Services;

use App\Models\Journalier;
use App\Models\Pointage;
use Illuminate\Validation\ValidationException;

class PointageService
{
    /**
     * Résout un journalier à partir du contenu scanné.
     * Accepte d'abord le qr_token (badge QR), puis le matricule (douchette 1D).
     */
    public function resoudreJournalier(string $code): Journalier
    {
        $code = trim($code);

        $journalier = Journalier::where('qr_token', $code)
            ->orWhere('matricule', $code)
            ->first();

        if (! $journalier) {
            throw ValidationException::withMessages([
                'code' => "Badge inconnu : aucun journalier ne correspond à ce code.",
            ]);
        }

        if (! $journalier->actif) {
            throw ValidationException::withMessages([
                'code' => "Ce journalier est désactivé.",
            ]);
        }

        return $journalier;
    }

    /**
     * Enregistre un scan : premier scan du jour = arrivée, second = départ.
     * Retourne le pointage et l'action réellement effectuée ('arrivee' | 'depart' | 'deja_complet').
     *
     * @return array{pointage: Pointage, action: string}
     */
    public function scanner(Journalier $journalier, int $chantierId, ?int $userId, string $source): array
    {
        $aujourdhui = now()->toDateString();

        // whereDate compare uniquement la partie date, quel que soit le format stocké.
        $pointage = Pointage::whereDate('date', $aujourdhui)
            ->where('journalier_id', $journalier->id)
            ->where('chantier_id', $chantierId)
            ->first()
            ?? new Pointage([
                'journalier_id' => $journalier->id,
                'chantier_id' => $chantierId,
                'date' => $aujourdhui,
            ]);

        $action = 'arrivee';

        if (! $pointage->exists || ! $pointage->heure_arrivee) {
            // Premier scan de la journée -> arrivée
            $pointage->fill([
                'pointe_par' => $userId,
                'heure_arrivee' => now(),
                'statut' => 'present',
                'source' => $source,
            ]);
            $action = 'arrivee';
        } elseif (! $pointage->heure_depart) {
            // Deuxième scan -> départ
            $pointage->heure_depart = now();
            $pointage->source = $source;
            $action = 'depart';
        } else {
            // Déjà arrivée + départ enregistrés
            $action = 'deja_complet';
        }

        $pointage->save();
        $pointage->load('journalier', 'chantier');

        return ['pointage' => $pointage, 'action' => $action];
    }
}
