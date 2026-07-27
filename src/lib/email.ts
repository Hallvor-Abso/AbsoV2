/**
 * Envoi d'emails transactionnels via Resend (API REST — aucune dépendance npm).
 *
 * Configuration (variables d'environnement) :
 *  - RESEND_API_KEY : clé API du compte Resend (https://resend.com).
 *  - EMAIL_FROM     : expéditeur, ex. « Absolution <no-reply@ta-guilde.fr> ».
 *                     À défaut, on retombe sur le domaine de test de Resend.
 *
 * Sans clé configurée, l'envoi est un no-op (log d'avertissement) : le reste du
 * site continue de fonctionner, seuls les emails ne partent pas.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Absolution <onboarding@resend.dev>';
  if (!key) {
    console.warn(`[email] RESEND_API_KEY manquant — email non envoyé (« ${subject} » → ${to}).`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[email] Envoi échoué :', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Erreur réseau :', err);
    return false;
  }
}
