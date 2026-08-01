<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pointages = un enregistrement de présence par journalier / par jour / par chantier.
 * Un scan enregistre l'arrivée ; le scan suivant du même jour enregistre le départ.
 * Ces lignes × taux_journalier alimentent le calcul de paie de Paiejour.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pointages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journalier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('chantier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pointe_par')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date');
            $table->dateTime('heure_arrivee')->nullable();
            $table->dateTime('heure_depart')->nullable();
            $table->enum('statut', ['present', 'absent', 'demi_journee'])->default('present');
            $table->enum('source', ['camera', 'douchette', 'manuel'])->default('camera');
            $table->timestamps();

            // Un seul pointage par journalier / chantier / jour
            $table->unique(['journalier_id', 'chantier_id', 'date']);
            $table->index(['date', 'chantier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pointages');
    }
};
