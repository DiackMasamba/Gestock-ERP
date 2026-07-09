# Gestock Chat — Messagerie interne d'entreprise

Application mobile de messagerie interne pour une entreprise, construite avec
**Expo (React Native)** et **Supabase**.

## Fonctionnalités

- 🔐 Authentification email / mot de passe (rôles `admin` / `employee`)
- 💬 Conversations **1-à-1** et **groupes** en **temps réel**
- 📎 Partage d'**images** et de **fichiers** (stockage privé)
- 🔔 **Notifications push** (Expo) sur nouveau message
- ✅ Compteurs de messages non lus, accusés de lecture

## Stack

| Couche | Technologie |
|---|---|
| Mobile | Expo SDK 57, React Native, TypeScript, Expo Router |
| Données | Supabase (Postgres + RLS) |
| Temps réel | Supabase Realtime |
| Fichiers | Supabase Storage (bucket privé + URLs signées) |
| Cache/état | TanStack Query |
| Push | expo-notifications + Edge Function Supabase → Expo Push API |

## Prérequis

- Node.js 20+
- Un compte [Supabase](https://supabase.com)
- L'app **Expo Go** (dev rapide) ou un build de développement pour tester le push
  sur appareil réel

## 1. Installation

```bash
npm install
cp .env.example .env
```

Renseignez ensuite `.env` avec l'URL et la clé anonyme de votre projet Supabase
(Dashboard → *Project Settings* → *API*) :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 2. Configuration de la base Supabase

Exécutez les migrations dans l'ordre. Deux options :

**Option A — Éditeur SQL du dashboard** : copiez-collez le contenu de
`supabase/migrations/000_init.sql` puis `supabase/migrations/001_storage.sql`
dans l'éditeur SQL et exécutez-les.

**Option B — Supabase CLI** :

```bash
supabase link --project-ref <votre-ref>
supabase db push
```

Ces scripts créent les tables (`profiles`, `conversations`,
`conversation_members`, `messages`), les politiques **RLS**, le bucket privé
`attachments`, les fonctions RPC de création de conversations, et activent le
Realtime sur `messages`.

> Le profil d'un utilisateur est créé automatiquement à l'inscription via le
> trigger `on_auth_user_created`.

## 3. Notifications push (Edge Function)

1. Déployez la fonction :

   ```bash
   supabase functions deploy send-push --no-verify-jwt
   ```

2. Créez un **Database Webhook** (Dashboard → *Database* → *Webhooks*) :
   - Table : `messages`
   - Événement : `INSERT`
   - Type : *Supabase Edge Functions* → `send-push`

   À chaque nouveau message, la fonction envoie une notification aux autres
   membres de la conversation via l'API Expo Push.

> Les notifications push ne fonctionnent que sur **appareil physique** avec un
> **projet EAS** configuré (`eas init`) pour obtenir un `projectId`.

## 4. Lancement

```bash
npm start
```

Scannez le QR code avec Expo Go (Android) ou l'app Caméra (iOS).

## Vérification rapide

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

Test fonctionnel : inscrivez **deux** utilisateurs, démarrez une conversation
directe, échangez des messages (ils apparaissent en temps réel), envoyez une
image et un fichier, puis vérifiez la réception d'une notification push
app fermée.

## Structure du projet

```
app/                 Écrans (Expo Router)
  (auth)/            Connexion / inscription
  (app)/             Espace authentifié : liste, chat, nouvelle discussion, profil
src/
  auth/              AuthProvider (session Supabase)
  components/        Composants UI réutilisables
  hooks/             Hooks React Query + temps réel
  lib/               Client Supabase, thème, formatage
  services/          Accès données (conversations, messages, storage, push)
  types/             Types du schéma
supabase/
  migrations/        Schéma SQL + RLS + storage
  functions/         Edge Function push
```
