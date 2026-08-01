<?php

namespace App\Services;

use App\Models\Journalier;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class BadgeService
{
    /**
     * Génère le QR code du badge d'un journalier au format SVG.
     * Le SVG ne requiert pas l'extension Imagick (rendu vectoriel pur).
     * Le contenu encodé est le qr_token, résolu côté API au moment du scan.
     */
    public function qrSvg(Journalier $journalier, int $taille = 300): string
    {
        return QrCode::format('svg')
            ->size($taille)
            ->margin(1)
            ->errorCorrection('M')
            ->generate($journalier->qr_token);
    }
}
