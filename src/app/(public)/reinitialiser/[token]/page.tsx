import Link from 'next/link';
import { isResetTokenValid } from '@/lib/password-reset';
import { ResetForm } from './reset-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Réinitialiser le mot de passe — Absolution' };

export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
  const valid = await isResetTokenValid(params.token);

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      {valid ? (
        <ResetForm token={params.token} />
      ) : (
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-title">Lien invalide</h1>
          <p className="mt-2 text-sm text-muted">
            Ce lien de réinitialisation est invalide ou expiré (il n'est valable qu'une heure).
          </p>
          <Link
            href="/mot-de-passe-oublie"
            className="mt-4 inline-block font-medium text-accent hover:text-accent-deep"
          >
            Refaire une demande
          </Link>
        </div>
      )}
    </div>
  );
}
