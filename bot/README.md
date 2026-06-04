# Bot Discord — Absolution

Bot Discord de la guilde, qui lit **la même base de données que le site**
(architecture Option A, cf. `docs/BOT.md`). Construit avec **discord.js v14** et
**Prisma**.

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `/recrutement [jeu]` | Postes de recrutement et leur statut (ouvert / limité / fermé). |
| `/progression [jeu]` | Avancement du raid en cours (boss tués / en cours). |

L'option `jeu` est facultative (slug `wow` ou un bout du nom) ; sans elle, le
premier jeu actif est utilisé.

## Lancer en local

1. **Créer l'application + le bot** : https://discord.com/developers/applications
   → *New Application* → onglet **Bot** → *Reset Token* (copie le token).
2. **Inviter le bot** sur ton serveur : onglet **OAuth2 → URL Generator**,
   coche `bot` + `applications.commands`, ouvre l'URL générée.
3. **Configurer l'environnement** : copie `bot/.env.example` en `.env` à la
   racine et remplis les valeurs (dont la **même `DATABASE_URL` que le site**).
4. **Générer le client Prisma** (si pas déjà fait) : `npx prisma generate`.
5. **Enregistrer les commandes** : `npm run bot:register`.
6. **Démarrer le bot** : `npm run bot:dev`.

> `bot:dev` / `bot:register` chargent le `.env` local. En production, les
> variables sont injectées par l'hébergeur (pas de `.env`), et on lance
> `npm run bot` (et `tsx bot/register-commands.ts` une fois pour les commandes).

## Vérifier le code

```bash
npm run bot:check   # typecheck du dossier bot/
```

## Héberger (process long-running, PAS sur Vercel)

Le bot maintient une connexion permanente à Discord : il lui faut un hébergeur
de process continu (le site, lui, reste sur Vercel).

Le dossier `bot/` a son **propre `package.json`** (sans Next ni les dépendances
du site) : le bot est autonome et léger, et le scan de sécurité ne voit que ses
dépendances.

**Exemple Railway :**
1. *New Project* → *Deploy from GitHub repo* → ce dépôt, branche du bot.
2. **Settings → Source → Root Directory = `bot`** ⚠️ (indispensable : Railway ne
   construit alors que le bot, pas le site).
3. Variables (onglet **Variables**) : `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`,
   `DISCORD_GUILD_ID` (recommandé), `DATABASE_URL` (la même que le site).
4. C'est tout : `npm install` génère le client Prisma (postinstall), puis le
   service démarre via `npm start`. **Les commandes slash s'enregistrent
   automatiquement** au démarrage — aucune étape manuelle.

> ⚠️ **Schéma Prisma** : `bot/prisma/schema.prisma` est une **copie** de
> `prisma/schema.prisma` (le bot ne fait que lire). Si tu modifies le schéma du
> site, reporte le changement ici aussi.

> `register-commands.ts` reste disponible (`npm run bot:register` en local) pour
> un enregistrement manuel, mais ce n'est pas nécessaire.

## Prochaines briques (idées)

- Auto-post des news sur un salon à la publication (webhook depuis le site).
- `/calendrier` : prochains raids + RSVP (écriture → nouvelle table `EventSignup`).
- Notif quand un poste de recrutement passe « ouvert ».
