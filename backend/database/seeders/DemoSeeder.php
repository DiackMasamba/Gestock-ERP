<?php

namespace Database\Seeders;

use App\Models\Chantier;
use App\Models\Journalier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Opérateur / superviseur de démonstration
        User::updateOrCreate(
            ['email' => 'admin@paiejour.test'],
            ['name' => 'Superviseur Démo', 'password' => Hash::make('password')],
        );

        // Chantiers
        $chantiers = [
            ['nom' => 'Chantier Almadies', 'code' => 'ALM', 'adresse' => 'Dakar, Almadies'],
            ['nom' => 'Chantier Diamniadio', 'code' => 'DIA', 'adresse' => 'Diamniadio'],
        ];
        foreach ($chantiers as $c) {
            Chantier::updateOrCreate(['code' => $c['code']], $c);
        }

        // Journaliers
        $journaliers = [
            ['matricule' => 'J-0001', 'nom' => 'Diop', 'prenom' => 'Moussa', 'taux_journalier' => 5000],
            ['matricule' => 'J-0002', 'nom' => 'Ndiaye', 'prenom' => 'Awa', 'taux_journalier' => 5500],
            ['matricule' => 'J-0003', 'nom' => 'Fall', 'prenom' => 'Ibrahima', 'taux_journalier' => 5000],
            ['matricule' => 'J-0004', 'nom' => 'Sow', 'prenom' => 'Fatou', 'taux_journalier' => 6000],
        ];
        foreach ($journaliers as $j) {
            Journalier::updateOrCreate(['matricule' => $j['matricule']], $j);
        }
    }
}
