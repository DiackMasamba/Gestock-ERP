# SeneLive

Marketplace sénégalaise de vente en ligne, pensée pour remplacer la vente par
captures WhatsApp : des **vendeurs identifiés et notés**, des **boutiques
proches de l'acheteur**, une **commande en quelques taps**.

Le live vidéo (le modèle Whatnot) est prévu en **phase 2** ; le socle de données
est déjà en place pour l'accueillir.

## Stack

| Couche | Choix |
|---|---|
| Web | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Données | Supabase — PostgreSQL 17 + RLS |
| Auth | Supabase Auth (e-mail/mot de passe ; téléphone prêt, voir plus bas) |
| Fichiers | Supabase Storage (buckets publics, écriture cloisonnée par boutique) |
| Temps réel | Supabase Realtime (chat des lives, phase 2) |

Projet Supabase : **SeneLive** — `rmnsevkzdjapjmjnagye`, région `eu-west-3`
(Paris, la plus proche de Dakar parmi les régions proposées).

## Démarrer

```bash
cd senelive
npm install
cp .env.example .env.local   # puis renseigner les deux variables
npm run dev
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://rmnsevkzdjapjmjnagye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé publishable, Dashboard -> Project Settings -> API>
```

La clé publishable est **faite pour être exposée au navigateur** : la sécurité
repose sur la RLS, jamais sur le secret de la clé.

## Ce qui fonctionne

- Inscription / connexion, création automatique du profil
- Ouverture d'une boutique (une par compte), rattachée à une ville
- Publication d'articles avec photos (upload direct vers Storage)
- Fil d'accueil filtrable **par ville** — les vendeurs proches d'abord
- Fiche produit et **commande en un formulaire** (Wave, Orange Money, Free
  Money, paiement à la livraison)
- Suivi de commande côté acheteur et côté vendeur, transitions de statut
- **Avis uniquement après livraison**, note de boutique recalculée en base

## Modèle de sécurité

Tout est appliqué côté PostgreSQL, jamais côté client :

- **RLS sur les 14 tables.** Une commande n'est visible que de son acheteur et
  de sa boutique ; `profiles` (qui contient les téléphones) n'est jamais lisible
  publiquement — l'identité publique d'un vendeur passe par `shops`, celle d'un
  avis par `reviews.author_name`.
- **`place_order()`** est le seul moyen de créer une commande. Prix, frais de
  livraison et décrément de stock sont calculés en base, avec un `SELECT … FOR
  UPDATE` sur l'annonce : deux acheteurs ne peuvent pas prendre la même dernière
  pièce.
- **`orders.subtotal` est dérivé** de `order_items` à chaque écriture : un
  client ne peut pas imposer un montant.
- **Un vendeur ne peut ni se vérifier lui-même ni se fabriquer une note** — un
  trigger restaure ces colonnes, que la RLS ne sait pas filtrer.
- **Transitions de statut contrôlées** : l'acheteur ne peut qu'annuler une
  commande encore en attente, le vendeur ne peut pas sauter d'étape ni modifier
  l'adresse de livraison.
- **Les fonctions internes vivent dans le schéma `private`**, hors de l'API
  PostgREST. Seule `place_order()` est exposée en RPC, volontairement.

Ces règles ont été vérifiées par des tentatives de fraude réelles exécutées sous
l'identité d'un acheteur puis d'un vendeur (montants forcés, auto-vérification,
avis sans livraison, commande créée sans passer par le RPC) : toutes refusées ou
neutralisées.

## Migrations

`supabase/migrations/`, à appliquer dans l'ordre :

| Fichier | Contenu |
|---|---|
| `001_init.sql` | Régions, villes, profils, boutiques, catalogue, RLS |
| `002_orders.sql` | Commandes, `place_order()`, avis, abonnements |
| `003_storage.sql` | Buckets et policies de stockage |
| `004_seed_reference.sql` | 14 régions, 44 villes, 12 catégories |
| `005_shows.sql` | Socle des lives (phase 2) |
| `006_harden_functions.sql` | Fonctions internes déplacées hors de l'API |
| `007_fix_order_totals.sql` | Sous-total dérivé au lieu d'être gardé |

Régénérer les types après toute migration :

```bash
npx supabase gen types typescript --project-id rmnsevkzdjapjmjnagye > src/lib/database.types.ts
```

## Ce qui reste à brancher

- **Vérification du téléphone par SMS.** Le schéma et la normalisation `+221`
  sont prêts (`profiles.phone`, `phone_verified_at`), mais l'OTP exige un
  fournisseur SMS configuré dans Supabase (Twilio, Vonage, MessageBird) — c'est
  payant. Tant qu'il n'est pas branché, le badge « Vérifié » s'attribue à la
  main par un administrateur.
- **Connexion Google / Facebook.** À activer dans Supabase Auth ; le trigger
  `handle_new_user()` lit déjà `full_name` et `avatar_url` des métadonnées.
- **Paiement réel.** Les moyens de paiement sont enregistrés mais aucun n'est
  encaissé : il faut intégrer les API Wave et Orange Money.
- **Live vidéo.** Supabase ne diffuse pas de vidéo. Il faudra LiveKit, Mux,
  Agora ou Cloudflare Stream ; `shows.room` est prévu pour référencer la salle.
- **Frais de livraison.** `private.delivery_fee_for()` applique un barème
  provisoire (1 000 FCFA même ville, 2 500 sinon), à remplacer par les vrais
  tarifs coursier.

## Contrôles

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # build de production
```
