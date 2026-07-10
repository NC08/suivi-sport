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
 └─ blocks : SessionBlock (position, format, rounds, durationSec, restSec,
             notes + résultat de bloc : resultTimeSec/Rounds/ExtraReps/Rpe/Notes)
      └─ exercises : SessionExercise (position + prescription du coach :
                     targetSets/Reps/WeightKg/DurationSec/DistanceM, instructions)
           ├─ exercise : Exercise (bibliothèque réutilisable — name unique, category)
           └─ performanceSets : PerformanceSet (réalisation de l'athlète, une ligne
                                par série : reps, weightKg, durationSec, distanceM,
                                rpe, notes — toutes optionnelles)
```

Principes :

- **Blocs typés** : une séance se compose de blocs dont le `format` détermine
  le formulaire de prescription et de saisie — `STANDARD` (séries classiques),
  `SUPERSET` (exercices alternés sur N tours), `INTERVALS` (fractionné
  effort/récup), `AMRAP`, `FOR_TIME`, `EMOM`. Les formats chronométrés portent
  leur résultat sur le bloc (temps, tours + reps, minutes réussies) ; les
  autres se saisissent série par série (`PerformanceSet`).
- **Bibliothèque d'exercices** : `Exercise` est unique et référencé par
  `SessionExercise` ; un même exercice apparaît dans autant de séances que
  nécessaire sans duplication — la progression se calcule par `exerciseId`.
- **Métriques flexibles** : prescription et réalisation portent les mêmes
  métriques optionnelles (répétitions, charge, temps, distance, RPE) ; on ne
  renseigne que celles qui ont du sens pour le format du bloc. Les colonnes
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
    progress.ts         # agrégats de progression (hebdo + par exercice)
  server/
    actions.ts          # server actions (validées zod + contrôle de rôle)
  components/
    SessionForm.tsx     # constructeur de séance par blocs (client)
    PerformanceEditor.tsx # saisie des séries réalisées (client)
    BlockResultForm.tsx # résultat d'un bloc AMRAP / For Time / EMOM (client)
  app/
    login/              # page de connexion (Google + connexion dev)
    api/auth/[...nextauth]/
    (app)/              # pages authentifiées (header + nav communs)
      coach/            # dashboard, nouvelle séance, détail, exercices
      seances/          # côté athlète : liste + détail/saisie
      progression/      # graphiques d'évolution (recharts)
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

Guide pas-à-pas complet dans **[DEPLOY.md](DEPLOY.md)** (Neon, client Google
OAuth, variables Vercel, seed, dépannage). En résumé : le script
`vercel-build` applique les migrations Prisma à chaque déploiement, la
connexion dev est automatiquement désactivée sur Vercel, et `AUTH_URL` est
détectée — il n'y a que les six variables d'environnement à renseigner.

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

## Page de progression

`/progression` (athlète : ses données ; coach : sélecteur d'athlète) :

- **Séances par semaine** — terminées, empilées par type, assignées non
  réalisées en gris, ligne d'objectif à 4/semaine (+ vue tableau).
- **RPE global moyen** et **volume total** (tonnage) par semaine.
- **Par exercice** (sélecteur) : charge max et 1RM estimé (formule d'Epley),
  volume par séance, temps total par séance — chaque graphique n'apparaît
  que si la métrique existe pour l'exercice.
- **Blocs chronométrés** (sélecteur) : les WODs sont regroupés par format et
  composition identiques (mêmes exercices, mêmes cibles) ; temps For Time
  (plus bas = mieux), score AMRAP en répétitions totales, minutes réussies
  d'un EMOM face au prescrit.

Pour voir les graphiques avec des données réalistes en local :
`npx tsx prisma/demo-data.ts` (10 semaines d'historique pour le compte
athlète de dev ; remplace ses séances existantes — dev uniquement).

## Duplication et édition (coach)

Depuis le détail d'une séance : **Dupliquer** ouvre le formulaire de création
pré-rempli (date du jour) ; **Modifier** édite la séance en place — les blocs
sont remplacés, avec avertissement si l'athlète a déjà saisi des réalisations
(elles seraient supprimées).

## Prochaines itérations

- Déploiement en ligne (Vercel + Neon) — procédure ci-dessus.
- Réouverture d'une séance terminée ; suppression de séance.
- Modèles de séances récurrentes.
