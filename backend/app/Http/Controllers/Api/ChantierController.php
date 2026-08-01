<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chantier;
use Illuminate\Http\JsonResponse;

class ChantierController extends Controller
{
    /**
     * Liste des chantiers actifs (pour le sélecteur avant le scan).
     */
    public function index(): JsonResponse
    {
        $chantiers = Chantier::where('actif', true)
            ->orderBy('nom')
            ->get(['id', 'nom', 'code', 'adresse']);

        return response()->json(['data' => $chantiers]);
    }
}
