/**
 * Détection du « mode démo ».
 *
 * Le site fonctionne sans base de données pour permettre une simple
 * prévisualisation du design. Si la variable d'environnement DATABASE_URL
 * n'est PAS définie, on bascule en mode démo : les pages publiques affichent
 * des données d'exemple (voir src/lib/demo-data.ts).
 *
 * Dès qu'une vraie base est configurée (DATABASE_URL présent), ce mode se
 * désactive automatiquement et les données proviennent de la base.
 */
export const IS_DEMO = !process.env.DATABASE_URL;
