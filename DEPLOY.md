# Déploiement en ligne — Vercel + Neon + Google OAuth

Trois services à configurer, tous gratuits à votre échelle (2 utilisateurs).
Comptez 20 à 30 minutes. Ordre conseillé : base de données → Google OAuth →
Vercel.

## 1. Base de données PostgreSQL (Neon)

1. Créez un compte sur [neon.tech](https://neon.tech) (connexion GitHub
   possible) et créez un projet, par exemple `suivi-sport`, région
   `eu-central-1` (Francfort).
2. Dans le tableau de bord, copiez la **chaîne de connexion** (bouton
   *Connect*), variante **pooled** de préférence. Elle ressemble à :

   ```
   postgresql://user:motdepasse@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   C'est votre `DATABASE_URL` de production. Gardez-la sous la main.

> Alternative : Supabase, Railway, ou n'importe quel PostgreSQL managé —
> seule la chaîne de connexion change.

## 2. Client Google OAuth

1. Ouvrez [console.cloud.google.com](https://console.cloud.google.com/) et
   créez un projet (ex : `suivi-sport`).
2. Menu **APIs & Services → OAuth consent screen** :
   - Type d'audience : **External**, puis renseignez nom de l'app et email.
   - Vous pouvez laisser l'app en mode *Testing* : ajoutez alors vos deux
     adresses Gmail (vous + votre coach) dans **Test users** — personne
     d'autre ne pourra utiliser le bouton Google, ce qui est parfait ici.
3. Menu **APIs & Services → Credentials → Create credentials → OAuth client
   ID** :
   - Type : **Web application**.
   - **Authorized redirect URIs** : vous ajouterez l'URL exacte après le
     premier déploiement Vercel (étape 3.4). Si vous connaissez déjà le nom
     du projet, ce sera :

     ```
     https://<votre-app>.vercel.app/api/auth/callback/google
     ```
4. Notez le **Client ID** (`AUTH_GOOGLE_ID`) et le **Client secret**
   (`AUTH_GOOGLE_SECRET`).

## 3. Vercel

1. Sur [vercel.com](https://vercel.com), **Add New → Project**, importez le
   dépôt GitHub `suivi-sport`. Framework détecté : Next.js — ne changez rien
   au build (le script `vercel-build` du projet applique automatiquement les
   migrations Prisma à chaque déploiement).
2. Avant de cliquer sur *Deploy*, ouvrez **Environment Variables** et
   renseignez :

   | Variable | Valeur |
   | --- | --- |
   | `DATABASE_URL` | la chaîne Neon de l'étape 1 |
   | `AUTH_SECRET` | générez-la : `openssl rand -base64 32` |
   | `AUTH_GOOGLE_ID` | Client ID Google |
   | `AUTH_GOOGLE_SECRET` | Client secret Google |
   | `ALLOWED_EMAILS` | `vous@gmail.com,coach@gmail.com` |
   | `COACH_EMAILS` | `coach@gmail.com` |

   Ne définissez **pas** `AUTH_DEV_LOGIN` (la connexion dev est de toute
   façon désactivée sur Vercel) ni `AUTH_URL` (détectée automatiquement).
3. Cliquez sur **Deploy**. Le build applique les migrations sur Neon puis
   met l'app en ligne sur `https://<votre-app>.vercel.app`.
4. Retournez dans la console Google (étape 2.3) et ajoutez le redirect URI
   définitif : `https://<votre-app>.vercel.app/api/auth/callback/google`.

## 4. Peupler la bibliothèque d'exercices

Depuis votre machine, une seule fois :

```bash
DATABASE_URL="<chaîne Neon>" npm run db:seed
```

(Le seed est idempotent ; sans `AUTH_DEV_LOGIN` il ne crée aucun compte de
dev, uniquement les 36 exercices de départ.)

## 5. Première connexion

1. Ouvrez l'app et connectez-vous avec Google : votre compte est créé au
   premier login (seuls les emails de `ALLOWED_EMAILS` passent).
2. L'email listé dans `COACH_EMAILS` reçoit le rôle **coach** à sa première
   connexion ; les autres sont **athlète**.
3. Le coach crée sa première séance — c'est parti.

## Mises à jour

Chaque `git push` sur la branche de production déclenche un déploiement,
migrations comprises. Les migrations Prisma sont additives et versionnées
dans `prisma/migrations/`.

## Dépannage

- **Erreur `redirect_uri_mismatch` au login Google** : le redirect URI dans
  la console Google ne correspond pas exactement à l'URL Vercel (protocole,
  domaine, chemin `/api/auth/callback/google`).
- **`AccessDenied` après le consentement Google** : l'email n'est pas dans
  `ALLOWED_EMAILS` (ou l'app Google est en mode *Testing* et l'email n'est
  pas dans *Test users*).
- **Erreur Prisma au build** : vérifiez `DATABASE_URL` (variante *pooled*
  Neon avec `?sslmode=require`).
- **Mauvais rôle attribué** : corrigez `COACH_EMAILS` puis reconnectez-vous
  (le rôle est resynchronisé à chaque login).
