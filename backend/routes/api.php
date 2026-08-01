<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChantierController;
use App\Http\Controllers\Api\JournalierController;
use App\Http\Controllers\Api\PointageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Paiejour — module Pointage (scan de badges des journaliers)
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Chantiers (sélecteur avant scan)
    Route::get('/chantiers', [ChantierController::class, 'index']);

    // Journaliers + badge QR
    Route::get('/journaliers', [JournalierController::class, 'index']);
    Route::post('/journaliers', [JournalierController::class, 'store']);
    Route::get('/journaliers/{journalier}', [JournalierController::class, 'show']);
    Route::get('/journaliers/{journalier}/badge', [JournalierController::class, 'badge']);

    // Pointage : point d'entrée du scan
    Route::post('/pointages/scan', [PointageController::class, 'scan']);
    Route::get('/pointages', [PointageController::class, 'index']);
});
