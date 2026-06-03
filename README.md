# Site officiel de la guilde **Absolution**

Site vitrine et de gestion pour une guilde semi-hardcore de MMORPG (World of
Warcraft, et bientôt SWTOR). Esthétique sobre et professionnelle, proche d'un
site d'organisation e-sport. **Tout se gère depuis une interface
d'administration** : aucune ligne de code à toucher au quotidien.

> 👋 **Tu débutes en développement web ?** Ce guide est fait pour toi. Suis les
> étapes dans l'ordre, sans en sauter. Chaque action est expliquée.

---

## 📑 Sommaire

1. [Ce que fait le site](#-ce-que-fait-le-site)
2. [Les outils dont tu as besoin (gratuits)](#-les-outils-dont-tu-as-besoin-gratuits)
3. [Installation sur ton ordinateur (local)](#-installation-sur-ton-ordinateur-local)
4. [Mise en ligne : Supabase + Vercel](#-mise-en-ligne--supabase--vercel)
5. [Guide d'utilisation de l'admin](#-guide-dutilisation-de-ladmin)
6. [Erreurs courantes et solutions](#-erreurs-courantes-et-solutions)
7. [Comment le projet est organisé](#-comment-le-projet-est-organisé)

---

## 🎯 Ce que fait le site

**Pages publiques** (visibles par tout le monde) :

- **Accueil** : présentation de la guilde, jeux actifs, progression récente, postes recherchés.
- **Progression** : avancée des raids boss par boss, par jeu et par tier.
- **News** : articles et annonces.
- **Recrutement** : postes ouverts + formulaire de candidature.
- **Calendrier** : raids et événements à venir.

**Espace admin** (réservé, protégé par mot de passe, à l'adresse `/admin`) :

- Activer/désactiver un jeu (un jeu désactivé disparaît **complètement** du site public).
- Rédiger des news avec un éditeur de texte.
- Mettre à jour la progression (boss tués, dates).
- Gérer les postes de recrutement et lire les candidatures reçues.
- Planifier des événements de calendrier.
- Modifier les textes de la page d'accueil et le logo.

---

## 🧰 Les outils dont tu as besoin (gratuits)

| Outil | À quoi ça sert | Lien |
|------|----------------|------|
| **Node.js** (version 18 ou plus) | Faire tourner le projet | <https://nodejs.org> (bouton « LTS ») |
| **Un éditeur de code** | Modifier les fichiers (recommandé : VS Code) | <https://code.visualstudio.com> |
| **Un compte GitHub** | Stocker le code en ligne | <https://github.com> |
| **Un compte Supabase** | La base de données (gratuit) | <https://supabase.com> |
| **Un compte Vercel** | Héberger le site (gratuit) | <https://vercel.com> |

> 💡 Pour vérifier que Node.js est installé, ouvre un **terminal** et tape
> `node --version`. Tu dois voir un numéro comme `v20.x.x`.

---

## 💻 Installation sur ton ordinateur (local)

Cette étape sert à faire tourner le site sur **ta machine** pour le tester
avant de le mettre en ligne. Tu peux aussi sauter directement à la
[mise en ligne](#-mise-en-ligne--supabase--vercel) si tu préfères.

### Étape 1 — Récupérer le code

Télécharge le projet (bouton vert « Code » → « Download ZIP » sur GitHub) puis
décompresse-le. Ouvre le dossier dans VS Code (`Fichier` → `Ouvrir le dossier`).

Ouvre ensuite un terminal **dans VS Code** (menu `Terminal` → `Nouveau terminal`).

### Étape 2 — Installer les dépendances

Dans le terminal, tape :

```bash
npm install
```

⏳ Patiente quelques minutes : l'ordinateur télécharge tout ce dont le projet a
besoin.

### Étape 3 — Créer ton fichier de configuration `.env`

1. Dans la liste des fichiers, repère **`.env.example`**.
2. Fais-en une copie et renomme-la **`.env`** (exactement, sans `.example`).
3. Ouvre `.env` : chaque ligne est commentée et explique quoi mettre.

Pour un test local rapide, tu peux utiliser une base Supabase gratuite (voir
l'étape « Mise en ligne » plus bas pour récupérer `DATABASE_URL` et
`DIRECT_URL`), puis remplir :

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="(une longue clé aléatoire)"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="choisis-un-mot-de-passe"
```

> 🔑 Pour générer `NEXTAUTH_SECRET`, va sur
> <https://generate-secret.vercel.app/32> et copie la valeur affichée.

### Étape 4 — Préparer la base de données

Cette commande crée les tables **et** ajoute des données d'exemple (jeux WoW &
SWTOR, progression, news) ainsi que ton compte admin :

```bash
npm run setup
```

### Étape 5 — Lancer le site

```bash
npm run dev
```

Ouvre ton navigateur sur **<http://localhost:3000>** 🎉

- Le site public est sur `http://localhost:3000`
- L'espace admin est sur `http://localhost:3000/admin`
  (connecte-toi avec `ADMIN_USERNAME` / `ADMIN_PASSWORD` de ton `.env`).

Pour arrêter le site, reviens dans le terminal et appuie sur `Ctrl + C`.

---

## 🚀 Mise en ligne : Supabase + Vercel

On met en ligne en deux temps : d'abord la **base de données** (Supabase),
puis le **site** (Vercel). Aucune commande compliquée, presque tout se fait à
la souris.

### Partie A — La base de données (Supabase)

1. Crée un compte sur <https://supabase.com> puis clique sur **« New project »**.
   - *📸 Capture suggérée : le bouton « New project ».*
2. Donne un nom (ex. `absolution`), **choisis un mot de passe de base de
   données** (note-le précieusement !) et une région proche de tes joueurs
   (ex. `Central EU (Frankfurt)`). Clique sur **« Create new project »**.
3. Attends ~2 minutes que le projet se crée.
4. Va dans **Settings** (la roue crantée en bas à gauche) → **Database**.
   - *📸 Capture suggérée : le menu Settings → Database.*
5. Dans la section **« Connection string »**, onglet **« URI »** :
   - Copie l'URL **« Transaction pooler »** (port **6543**) → ce sera ton
     `DATABASE_URL`.
   - Copie l'URL **« Direct connection »** (port **5432**) → ce sera ton
     `DIRECT_URL`.
   - *📸 Capture suggérée : les deux chaînes de connexion.*
6. Dans chaque URL, remplace `[YOUR-PASSWORD]` par le mot de passe choisi à
   l'étape 2. **Garde ces deux URL de côté**, on s'en sert juste après.

### Partie B — Mettre le code sur GitHub

1. Crée un dépôt (repository) vide sur <https://github.com> (bouton « New »).
2. Envoie le code dedans. Le plus simple : sur la page de ton dépôt vide,
   GitHub affiche des instructions « …or push an existing repository ». Si tu
   débutes, l'application **GitHub Desktop** (<https://desktop.github.com>)
   permet de tout faire à la souris : `Add` ton dossier, puis `Publish`.

> ⚠️ Vérifie que le fichier `.env` n'est **pas** envoyé sur GitHub. Il est déjà
> ignoré automatiquement (fichier `.gitignore`), c'est normal et voulu : il
> contient tes mots de passe.

### Partie C — Le site (Vercel)

1. Crée un compte sur <https://vercel.com> en te connectant **avec GitHub**.
2. Clique sur **« Add New… » → « Project »**, puis **importe** ton dépôt GitHub.
   - *📸 Capture suggérée : l'écran d'import du projet.*
3. Avant de déployer, ouvre la section **« Environment Variables »** et ajoute
   **une par une** ces variables (Name = nom, Value = valeur) :

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | l'URL « Transaction pooler » de Supabase |
   | `DIRECT_URL` | l'URL « Direct connection » de Supabase |
   | `NEXTAUTH_SECRET` | une longue clé aléatoire (voir lien plus haut) |
   | `NEXTAUTH_URL` | *(à remplir après le 1er déploiement, voir étape 6)* |
   | `ADMIN_USERNAME` | l'identifiant admin de ton choix |
   | `ADMIN_PASSWORD` | un mot de passe **solide** |

   - *📸 Capture suggérée : le formulaire des variables d'environnement.*
4. Clique sur **« Deploy »** et patiente quelques minutes.
5. Vercel t'affiche l'adresse de ton site (ex. `https://absolution.vercel.app`).
6. **Important** : retourne dans **Settings → Environment Variables**, renseigne
   `NEXTAUTH_URL` avec cette adresse (ex. `https://absolution.vercel.app`), puis
   va dans l'onglet **Deployments** et clique sur **« Redeploy »** pour appliquer.

### Partie D — Initialiser la base (sans aucune ligne de commande)

Au premier déploiement, les tables sont créées automatiquement, mais la base
est encore **vide** (pas de compte admin ni de données). Pour l'initialiser, il
suffit d'**ouvrir une page une seule fois** :

1. Va sur **`https://ton-site.vercel.app/setup`**
2. Clique sur le bouton **« Initialiser le site »**.
3. C'est fait ✅ : ton compte admin (identifiants = `ADMIN_USERNAME` /
   `ADMIN_PASSWORD` de Vercel) et les données de départ (jeux WoW & SWTOR,
   progression, news d'exemple) sont créés.

Tu peux ensuite cliquer sur **« Aller à l'espace admin »** et te connecter.

> 🔒 La page `/setup` est **sans danger** : elle ne fait rien si le site est
> déjà initialisé (impossible d'écraser tes données par erreur). Tu peux même
> la rouvrir : elle te renverra simplement vers la connexion admin.

> 💡 *(Alternative pour les plus à l'aise)* : si tu préfères, tu peux aussi
> lancer la commande `npm run db:seed` depuis ton ordinateur après avoir mis les
> mêmes variables dans un fichier `.env` local. Mais la page `/setup` est plus
> simple.

---

## 🛠️ Guide d'utilisation de l'admin

Connecte-toi sur **`/admin`** avec ton identifiant et ton mot de passe.

- **Tableau de bord** : vue d'ensemble (candidatures en attente, dernière news,
  prochain raid, jeux actifs) + raccourcis.
- **Jeux** : le bouton **Visible/Masqué** active ou retire un jeu du site
  public. « Ajouter un jeu » te permet de préparer un futur jeu (ex. SWTOR) en
  statut « À venir ».
- **News** : « Nouvel article » ouvre l'éditeur. Laisse en **Brouillon** tant
  que ce n'est pas prêt, passe en **Publié** pour le rendre visible.
- **Progression** : ajoute un *tier* de raid, puis ses *boss*. Pour chaque boss,
  choisis le statut (Non tenté / En progression / Tué) et la date de kill.
- **Recrutement** : définis les postes recherchés et leur statut
  (Ouvert / Limité / Fermé).
- **Candidatures** : lis les candidatures reçues, filtre-les, change leur statut
  et ajoute des **notes internes** (invisibles du public).
- **Calendrier** : ajoute des raids et événements.
- **Contenu du site** : modifie les textes de la page d'accueil et l'URL du logo.

> Toutes les modifications sont **visibles immédiatement** sur le site public.

### Changer le logo

Héberge ton image quelque part (par ex. **Supabase → Storage**, crée un bucket
public, uploade l'image, copie son URL publique), puis colle l'URL dans
**Admin → Contenu du site → Logo de la guilde**.

---

## 🆘 Erreurs courantes et solutions

| Message / symptôme | Cause probable | Solution |
|--------------------|----------------|----------|
| `Can't reach database server` | Les URL de base de données sont incorrectes | Revérifie `DATABASE_URL` et `DIRECT_URL`, et que `[YOUR-PASSWORD]` a bien été remplacé par ton vrai mot de passe Supabase. |
| Page blanche / erreur 500 après déploiement | `NEXTAUTH_URL` manquant ou faux | Mets l'adresse exacte de ton site Vercel dans `NEXTAUTH_URL`, puis **Redeploy**. |
| Impossible de se connecter à `/admin` | Le seed n'a pas été lancé, ou mauvais identifiants | Lance `npm run db:seed` (Partie D). Vérifie `ADMIN_USERNAME` / `ADMIN_PASSWORD`. |
| `Invalid prisma.xxx` / erreurs Prisma au build | Le client Prisma n'est pas généré | Lance `npx prisma generate` puis relance. (Sur Vercel c'est automatique.) |
| Les images ne s'affichent pas | URL d'image invalide ou non publique | Utilise une URL d'image **publique** en `https://...` |
| `npm install` échoue | Node.js trop ancien | Installe Node.js **18 ou plus récent** depuis nodejs.org |
| Un jeu n'apparaît pas sur le site | Il est en « Masqué » | Va dans **Admin → Jeux** et clique sur **Masqué** pour le rendre **Visible**. |
| « port 3000 already in use » en local | Le site tourne déjà dans un autre terminal | Ferme l'autre terminal, ou change de port : `npm run dev -- -p 3001`. |
| Mot de passe admin oublié | — | Change `ADMIN_PASSWORD` dans `.env` puis relance `npm run db:seed` (il met à jour le mot de passe). |

---

## 🗂️ Comment le projet est organisé

```
.
├─ prisma/
│  ├─ schema.prisma      → description de la base de données (les tables)
│  └─ seed.ts            → données de départ (jeux, news, compte admin…)
├─ src/
│  ├─ app/
│  │  ├─ (public)/       → les pages publiques (accueil, news, progression…)
│  │  ├─ admin/          → l'espace d'administration + actions.ts (sauvegardes)
│  │  └─ api/            → points d'entrée techniques (login, candidatures)
│  ├─ components/        → les "briques" d'affichage réutilisables
│  ├─ lib/               → le code utilitaire (base de données, sécurité, textes…)
│  └─ middleware.ts      → protège l'accès à l'espace admin
├─ .env.example          → modèle de configuration (à copier en .env)
└─ tailwind.config.ts    → les couleurs et la charte graphique du site
```

### Commandes utiles

| Commande | Effet |
|----------|-------|
| `npm run dev` | Lance le site en local (développement) |
| `npm run setup` | Crée les tables + ajoute les données de départ |
| `npm run db:seed` | (Re)remplit les données de départ |
| `npm run db:studio` | Ouvre une interface visuelle pour explorer la base |
| `npm run build` | Construit la version de production |

### Personnaliser les couleurs

Toutes les couleurs de la charte (noir profond, bleu signature, etc.) sont
centralisées dans **`tailwind.config.ts`**. Modifie-les à cet endroit pour les
répercuter sur tout le site.

---

## 🔒 Sécurité (déjà en place)

- L'espace admin est protégé par mot de passe (les mots de passe sont chiffrés).
- Le formulaire de candidature est limité (anti-spam) et toutes les données
  saisies sont nettoyées avant enregistrement.
- Les jeux désactivés sont filtrés **côté serveur** : aucune page publique n'est
  générée pour eux.

---

Bon jeu, et bonne progression à la guilde **Absolution** ! ⚔️
