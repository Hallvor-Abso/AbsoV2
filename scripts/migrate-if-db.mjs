// Lance les migrations Prisma UNIQUEMENT si une base de données est configurée.
//
// - En production avec base (DATABASE_URL défini) : applique les migrations.
// - En "mode démo" (aucune base) : on saute cette étape, ce qui permet de
//   déployer le site pour prévisualiser le design sans Supabase.
import { execSync } from 'node:child_process';

if (process.env.DATABASE_URL) {
  console.log('Base de données détectée : application des migrations…');
  execSync('prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('Mode démo : aucune base configurée, migrations ignorées.');
}
