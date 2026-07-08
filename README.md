# Suivi Sport

Application de suivi de performances sportives à deux rôles : le **coach** crée
et assigne les séances, l'**athlète** consulte ses séances et saisit ses
réalisations. Quatre types de séances : cardio, CrossFit, Hyrox, musculation.

## Stack

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router) | Front + API dans une seule app TypeScript, server actions (pas d'API REST à écrire), déploiement Vercel en un clic |
| Base de données | **PostgreSQL** | Base relationnelle robuste ; gratuite en managé (Neon, Supabase, Railway) |
| ORM | **Prisma** | Schéma déclaratif, migrations versionnées, client typé de bout en bout |
| Auth | **Auth.js v5** + Google OAuth | Pas de mot de passe à gérer, allowlist d'emails (app privée), rôle en session via JWT |
| UI | **Tailwind CSS 4** | Rapide à écrire et maintenir en solo |

## Modèle de données

```
User (role: COACH | ATHLETE)
 ├─ coachedSessions   ──┐
 └─ assignedSessions ───┤
                        ▼
TrainingSession (title, type, date, status, coachNotes, athleteNotes, sessionRpe)
 └─ exercises : SessionExercise (position + prescription du coach :
                targetSets/Reps/WeightKg/DurationSec/DistanceM, instructions)
      ├─ exercise : Exercise (bibliothèque réutilisable — name unique, category)
      └─ performanceSets : PerformanceSet (réalisation de l'athlète, une ligne
                           par série : reps, weightKg, durationSec, distanceM,
                           rpe, notes — toutes optionnelles)
```

Principes :

- **Bibliothèque d'exercices** : `Exercise` est unique et référencé par
  `SessionExercise` ; un même exercice apparaît dans autant de séances que
  nécessaire sans duplication — la progression se calcule par `exerciseId`.
- **Métriques flexibles** : prescription et réalisation portent les mêmes
  métriques optionnelles (répétitions, charge, temps, distance, RPE) ; on ne
  renseigne que celles qui ont du sens pour le type de séance. Les colonnes
  restent typées et requêtables pour les graphiques de progression.
- Les tables `Account`, `Session`, `VerificationToken` sont celles d'Auth.js.

## Arborescence

```
prisma/
  schema.prisma         # modèle de données
  seed.ts               # bibliothèque d'exercices + comptes dev
src/
  auth.ts               # config Auth.js complète (Google, rôles, allowlist)
  auth.config.ts        # config partagée avec le middleware (edge-safe)
  middleware.ts         # protection des routes + règle de rôle sur /coach
  lib/
    prisma.ts           # client Prisma singleton
    domain.ts           # libellés, badges, formatage (dates, prescriptions)
  server/
    actions.ts          # server actions (validées zod + contrôle de rôle)
  components/
    SessionForm.tsx     # création/assignation de séance (client)
    PerformanceEditor.tsx # saisie des séries réalisées (client)
  app/
    login/              # page de connexion (Google + connexion dev)
    api/auth/[...nextauth]/
    (app)/              # pages authentifiées (header + nav communs)
      coach/            # dashboard, nouvelle séance, détail, exercices
      seances/          # côté athlète : liste + détail/saisie
```

## Démarrer en local

```bash
npm install
cp .env.example .env    # puis remplir (voir ci-dessous)
npm run db:migrate      # crée le schéma
npm run db:seed         # bibliothèque d'exercices (+ comptes dev)
npm run dev
```

Avec `AUTH_DEV_LOGIN="true"` dans `.env`, la page de connexion propose deux
boutons **Coach** / **Athlète** pour tester les deux rôles sans OAuth
(comptes `coach@dev.local` et `athlete@dev.local` créés par le seed).
Ne jamais activer cette variable en production.

## Configuration (.env)

- `DATABASE_URL` — chaîne PostgreSQL.
- `AUTH_SECRET` — `openssl rand -base64 32`.
- `AUTH_URL` — URL publique de l'app.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — client OAuth créé sur
  [console.cloud.google.com](https://console.cloud.google.com/apis/credentials),
  avec `<AUTH_URL>/api/auth/callback/google` en redirect URI.
- `ALLOWED_EMAILS` — emails autorisés à se connecter (app privée).
- `COACH_EMAILS` — emails qui reçoivent le rôle COACH à la connexion ;
  tous les autres sont ATHLETE.

## Déploiement (Vercel + Neon)

1. Créer une base sur [neon.tech](https://neon.tech) et récupérer `DATABASE_URL`.
2. Importer le repo sur [vercel.com](https://vercel.com), renseigner les
   variables d'environnement ci-dessus (`AUTH_DEV_LOGIN` absent ou `false`).
3. Appliquer le schéma : `npm run db:deploy && npm run db:seed` (en local,
   avec `DATABASE_URL` pointant sur Neon).
4. Déclarer l'URL Vercel en redirect URI du client Google OAuth.

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | migration de dev (crée/applique) |
| `npm run db:deploy` | applique les migrations (production) |
| `npm run db:seed` | seed de la bibliothèque d'exercices |
| `npm run db:studio` | interface d'exploration de la base |

## Prochaines itérations

- Page de progression : charge max / 1RM estimé par exercice, volume total,
  temps sur distance, RPE moyen, régularité (4 séances/semaine).
- Formulaires spécialisés par type de séance (blocs cardio, EMOM/AMRAP,
  stations Hyrox) — l'ancienne version localStorage (voir historique git)
  sert de référence fonctionnelle.
- Duplication de séance, modèles de séances récurrentes.
