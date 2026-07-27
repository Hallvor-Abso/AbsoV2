import { ForgotForm } from './forgot-form';

export const metadata = { title: 'Mot de passe oublié — Absolution' };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <ForgotForm />
    </div>
  );
}
