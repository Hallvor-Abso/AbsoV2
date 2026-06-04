# Bot Discord Absolution — architecture & intégration

Ce document fixe **comment le bot communiquera avec le site** avant d'écrire le
bot lui-même. Objectif : éviter de coder dans le vide et choisir une base saine.

## 1. Deux directions d'échange

| Direction | Exemples | Mécanisme recommandé |
|-----------|----------|----------------------|
| **Site → Discord** (notifications) | nouvelle candidature, news publiée, statut de recrutement modifié | **Webhook entrant Discord** (`DISCORD_WEBHOOK_URL`) |
| **Discord → données** (commandes) | `/recrutement`, `/progress`, `/raid`, RSVP raid | **Le bot lit/écrit les données** (voir §2) |

La direction Site → Discord est **déjà en place** pour les candidatures
(`src/lib/discord.ts`, appelé depuis `POST /api/applications`). Il suffit de
renseigner `DISCORD_WEBHOOK_URL`. Aucune dépendance au bot.

## 2. Comment le bot accède aux données — décision à valider

Le bot est un **process long-running** (gateway Discord) : il ne peut pas tourner
sur Vercel (serverless). Il faut un hébergement type **Railway / Fly.io / VPS**.

Deux options pour qu'il lise/écrive les données de la guilde :

### Option A — Base de données partagée (recommandé pour démarrer)
Le bot utilise **le même PostgreSQL** que le site, via **Prisma** (même schéma).
- ✅ Le plus simple : zéro API à maintenir, typage Prisma réutilisé.
- ✅ Idéal pour les commandes en **lecture** (`/recrutement`, `/progress`).
- ⚠️ Le bot a les identifiants DB → l'héberger sur une plateforme de confiance.
- Pour les **écritures** (ex. RSVP), le bot écrit directement dans une table
  dédiée (`EventSignup`) — propre et découplé.

### Option B — API interne du site (`/api/bot/*`)
Le site expose des endpoints protégés par un secret partagé (`BOT_API_SECRET`,
en-tête `Authorization: Bearer …`). Le bot appelle ces endpoints.
- ✅ Le bot n'a pas les creds DB ; meilleure isolation si hébergement tiers.
- ✅ Logique métier centralisée côté site.
- ⚠️ Plus de code à écrire et à versionner des deux côtés.

> **Recommandation** : démarrer en **Option A** (lecture directe via Prisma +
> webhooks pour les notifs). Basculer un endpoint vers l'**Option B** seulement
> si une écriture sensible le justifie. Les deux peuvent coexister.

## 3. Fonctionnalités cibles (par ordre de valeur)

1. **Notifs candidatures** → salon officiers. *(fait, côté site)*
2. **`/recrutement [jeu]`** : postes ouverts/fermés/limités (lecture des
   `RecruitmentSlot`).
3. **Auto-post des news** à la publication (webhook depuis `saveNews`).
4. **`/progress [jeu]`** : avancement du tier courant (boss tués / en cours).
5. **Calendrier + RSVP** : annonce des raids et inscription par réaction/bouton
   (écriture → nouvelle table `EventSignup`).

## 4. Variables d'environnement

**Site (déjà supporté) :**
- `DISCORD_WEBHOOK_URL` — webhook du salon pour les notifications sortantes.

**Bot (à venir, son propre hébergement) :**
- `DISCORD_BOT_TOKEN` — token du bot (Discord Developer Portal).
- `DATABASE_URL` — **la même** que le site (Option A).
- `SITE_URL` — pour construire des liens vers le site.
- `BOT_API_SECRET` — uniquement si on ajoute l'Option B.

## 5. Où ranger le code du bot

- **Même dépôt (monorepo léger), dossier `bot/`** : partage du schéma Prisma et
  des types, un seul endroit à maintenir. *Recommandé.*
- Dépôt séparé : seulement si le bot est géré par une autre personne/équipe.

---

*Prochaine étape : valider l'Option A vs B, puis scaffolder `bot/` (discord.js +
Prisma) avec la commande `/recrutement` comme première brique.*
