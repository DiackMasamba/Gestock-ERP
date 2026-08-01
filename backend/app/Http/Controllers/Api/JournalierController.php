<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JournalierResource;
use App\Models\Journalier;
use App\Services\BadgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class JournalierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Journalier::query();

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('matricule', 'like', "%{$search}%");
            });
        }

        $journaliers = $query->orderBy('nom')->paginate(20);

        return JournalierResource::collection($journaliers)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'matricule' => ['required', 'string', 'unique:journaliers,matricule'],
            'nom' => ['required', 'string'],
            'prenom' => ['required', 'string'],
            'telephone' => ['nullable', 'string'],
            'taux_journalier' => ['required', 'numeric', 'min:0'],
        ]);

        $journalier = Journalier::create($data);

        return (new JournalierResource($journalier))->response()->setStatusCode(201);
    }

    public function show(Journalier $journalier): JsonResponse
    {
        return (new JournalierResource($journalier))->response();
    }

    /**
     * Renvoie le badge QR du journalier au format SVG (imprimable).
     */
    public function badge(Journalier $journalier, BadgeService $badges): Response
    {
        $svg = $badges->qrSvg($journalier);

        return response($svg, 200)->header('Content-Type', 'image/svg+xml');
    }
}
