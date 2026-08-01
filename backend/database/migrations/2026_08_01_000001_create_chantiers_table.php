<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Chantiers = les sites / lieux où les journaliers viennent pointer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chantiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('code')->unique();          // code court affiché au scan
            $table->string('adresse')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chantiers');
    }
};
