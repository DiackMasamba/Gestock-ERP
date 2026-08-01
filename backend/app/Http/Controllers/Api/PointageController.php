<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PointageResource;
use App\Models\Pointage;
use App\Services\PointageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PointageController extends Controller
{
    public function __construct(private readonly PointageService $service)
    {
    }

    /**
     * Enregistre un scan de badge. Point d'entrée principal de l'application.
     * Premier scan du jour = arrivée, deuxième = départ.
     */
    public function scan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],            // qr_token ou matricule scanné
            'chantier_id' => ['required', 'exists:chantiers,id'],
            'source' => ['nullable', 'in:camera,douchette,manuel'],
        ]);

        $journalier = $this->service->resoudreJournalier($data['code']);

        $resultat = $this->service->scanner(
            $journalier,
            (int) $data['chantier_id'],
            $request->user()?->id,
            $data['source'] ?? 'camera',
        );

        $messages = [
            'arrivee' => "Arrivée enregistrée.",
            'depart' => "Départ enregistré.",
            'deja_complet' => "Arrivée et départ déjà enregistrés aujourd'hui.",
        ];

        return response()->json([
            'action' => $resultat['action'],
            'message' => $messages[$resultat['action']],
            'pointage' => new PointageResource($resultat['pointage']),
        ]);
    }

    /**
     * Liste des pointages d'une journée pour un chantier (feuille de présence).
     */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
            'chantier_id' => ['nullable', 'exists:chantiers,id'],
        ]);

        $date = $data['date'] ?? now()->toDateString();

        $pointages = Pointage::with('journalier', 'chantier')
            ->whereDate('date', $date)
            ->when($data['chantier_id'] ?? null, fn ($q, $id) => $q->where('chantier_id', $id))
            ->orderByDesc('heure_arrivee')
            ->get();

        return PointageResource::collection($pointages)->response();
    }
}
