# Paiejour — Pointage des journaliers par scan de badge

Application de **lecture de code-barres / QR** permettant de pointer les
travailleurs journaliers (arrivée / départ) sur un chantier. Les pointages
collectés alimentent le calcul de **paie journalière** de Paiejour.

> Monorepo : `backend/` (API Laravel) + `frontend/` (PWA Angular).

---

## 1. Vue d'ensemble

```
┌───────────────────────┐        HTTPS / REST         ┌───────────────────────┐
│   Frontend Angular     │  ────────────────────────▶  │    Backend Laravel     │
│   (PWA scanner)        │   POST /api/pointages/scan  │    (API + module       │
│                        │  ◀────────────────────────  │     Pointage)          │
│  • Caméra (html5-qrcode)│      JSON (journalier,      │                        │
│  • Douchette USB/BT     │       action, heures)      │   • Sanctum (tokens)   │
│  • Feuille de présence  │                            │   • QR badge (SVG)     │
└───────────────────────┘                             └───────────┬───────────┘
                                                                   │
                                                          ┌────────▼────────┐
                                                          │  Base de données │
                                                          │  chantiers        │
                                                          │  journaliers      │
                                                          │  pointages ──────▶ Paie
                                                          └──────────────────┘
```

### Flux de pointage

1. Le superviseur se connecte (token Sanctum).
2. Il choisit un **chantier** puis un mode : **caméra** ou **douchette**.
3. Il scanne le **badge QR** (ou le matricule via douchette) d'un journalier.
4. L'API résout le journalier, puis :
   - **1er scan du jour** → enregistre l'**arrivée** ;
   - **2e scan du jour** → enregistre le **départ**.
5. L'écran confirme (nom, matricule, heures) + bip sonore, et met à jour la
   feuille de présence du jour.

---

## 2. Modèle de données

| Table         | Rôle | Champs clés |
|---------------|------|-------------|
| `chantiers`   | Sites de pointage | `nom`, `code`, `actif` |
| `journaliers` | Travailleurs journaliers | `matricule`, `qr_token` (ULID, encodé dans le QR), `taux_journalier`, `photo_path` |
| `pointages`   | Présence par jour/journalier/chantier | `date`, `heure_arrivee`, `heure_depart`, `statut`, `source` |
| `users`       | Opérateurs/superviseurs | Auth Sanctum |

Contrainte : **1 pointage par (journalier, chantier, jour)**.
Les lignes `pointages × journaliers.taux_journalier` constituent la base du
calcul de paie.

---

## 3. API (préfixe `/api`)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/login` | Connexion → token Sanctum |
| GET  | `/auth/me` | Utilisateur courant |
| POST | `/auth/logout` | Révoque le token |
| GET  | `/chantiers` | Chantiers actifs |
| GET  | `/journaliers` | Liste / recherche (`?q=`) |
| POST | `/journaliers` | Créer un journalier |
| GET  | `/journaliers/{id}` | Détail |
| GET  | `/journaliers/{id}/badge` | **QR du badge (SVG imprimable)** |
| POST | `/pointages/scan` | **Scan** `{ code, chantier_id, source }` |
| GET  | `/pointages?date=&chantier_id=` | Feuille de présence |

Réponse type d'un scan :

```json
{
  "action": "arrivee",
  "message": "Arrivée enregistrée.",
  "pointage": {
    "id": 12, "date": "2026-08-01",
    "heure_arrivee": "2026-08-01T07:12:00+00:00", "heure_depart": null,
    "statut": "present", "source": "camera",
    "journalier": { "id": 1, "matricule": "J-0001", "nom_complet": "Moussa Diop", "taux_journalier": 5000 }
  }
}
```

---

## 4. Démarrage

### Backend (Laravel)

```bash
cd backend
cp .env.example .env
php artisan key:generate
touch database/database.sqlite          # base SQLite par défaut
php artisan migrate --seed               # crée le schéma + données de démo
php artisan serve                        # http://localhost:8000
```

Compte de démonstration : `admin@paiejour.test` / `password`.

### Frontend (Angular)

```bash
cd frontend
npm install
npm start                                # http://localhost:4200
```

> L'URL de l'API se règle dans `frontend/src/environments/environment.ts`.

---

## 5. Matériel de scan

- **Caméra smartphone** : la PWA lit les QR via `html5-qrcode`
  (autorisation caméra requise, HTTPS en production).
- **Douchette USB / Bluetooth** : fonctionne en « keyboard-wedge » — elle
  tape le code puis `Entrée`. Le mode *Douchette* capture cette saisie.

Les deux modes appellent le même endpoint `POST /api/pointages/scan`.

---

## 6. Génération des badges

`GET /api/journaliers/{id}/badge` renvoie un **QR SVG** encodant le `qr_token`
du journalier. À imprimer sur les badges. Aucune extension Imagick requise
(rendu vectoriel).

---

## 7. Lien avec la paie Paiejour

Le module de scan ne calcule pas la paie : il **produit les présences**
fiables et horodatées. Un futur module `Paie` agrégera, par période :

```
montant = Σ (pointages présents) × journaliers.taux_journalier
```

Ce découplage garde le scanner simple et la paie auditable.
