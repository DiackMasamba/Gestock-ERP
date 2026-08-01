<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Journaliers = les travailleurs payés à la journée.
 * Le champ `qr_token` (ULID) est l'identifiant encodé dans le badge QR.
 * Le `matricule` sert de repli pour une douchette code-barres 1D.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journaliers', function (Blueprint $table) {
            $table->id();
            $table->string('matricule')->unique();       // ex: J-0001, lisible par douchette
            $table->string('qr_token')->unique();        // ULID encodé dans le QR du badge
            $table->string('nom');
            $table->string('prenom');
            $table->string('telephone')->nullable();
            $table->string('photo_path')->nullable();
            $table->decimal('taux_journalier', 10, 2)->default(0); // FCFA / jour -> alimente la paie
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->index(['actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journaliers');
    }
};
