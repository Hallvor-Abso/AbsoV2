'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import {
  fireTestAlert,
  setupTwitchSubscriptions,
  removeTwitchSubscription,
  disconnectTwitch,
} from '@/app/admin/actions';
import type { AlertType } from '@prisma/client';

type Sub = { id: string; type: string; status: string };

const TESTS: { type: AlertType; label: string }[] = [
  { type: 'FOLLOW', label: 'Tester follow' },
  { type: 'SUB', label: 'Tester sub' },
  { type: 'RESUB', label: 'Tester ré-abo' },
  { type: 'SUBGIFT', label: 'Tester gift' },
  { type: 'RAID', label: 'Tester raid' },
];

export function OverlayAlertsPanel({
  configured,
  login,
  subscriptions,
}: {
  configured: boolean;
  login: string;
  subscriptions: Sub[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const test = (type: AlertType) =>
    startTransition(async () => {
      await fireTestAlert(type);
      toast('Alerte de test envoyée — regarde l’overlay /overlay/alert.');
    });

  const setup = async () => {
    setBusy(true);
    try {
      const results = await setupTwitchSubscriptions();
      const ok = results.filter((r) => r.ok).length;
      const ko = results.filter((r) => !r.ok);
      if (ko.length === 0) toast(`Abonnements créés (${ok}/${results.length}).`);
      else toast(`${ok}/${results.length} OK. Échecs : ${ko.map((k) => `${k.type} (${k.detail})`).join(', ')}`, 'error');
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Échec de la création des abonnements.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) =>
    startTransition(async () => {
      await removeTwitchSubscription(id);
      toast('Abonnement supprimé.');
      router.refresh();
    });

  const disconnect = () =>
    startTransition(async () => {
      await disconnectTwitch();
      toast('Chaîne Twitch déconnectée.');
      router.refresh();
    });

  return (
    <section className="card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Alertes Twitch</h2>

      {!configured ? (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-semibold">Intégration Twitch non configurée.</p>
          <p className="mt-1 text-amber-200/80">
            Ajoute ces variables d’environnement puis redéploie : <code>TWITCH_CLIENT_ID</code>,{' '}
            <code>TWITCH_CLIENT_SECRET</code>, <code>TWITCH_EVENTSUB_SECRET</code> (une longue chaîne aléatoire).
            Crée une application sur <b>dev.twitch.tv/console</b> avec l’URL de redirection{' '}
            <code>&lt;ton-site&gt;/api/twitch/callback</code>. Les boutons de test fonctionnent quand même ci-dessous.
          </p>
        </div>
      ) : login ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Connecté : <b>{login}</b>
          </span>
          <button type="button" onClick={setup} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
            {busy ? 'Création…' : 'Créer / recréer les abonnements'}
          </button>
          <button type="button" onClick={disconnect} disabled={pending} className="btn-secondary text-sm">
            Déconnecter
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">Aucune chaîne connectée.</span>
          <a href="/api/twitch/connect" className="btn-primary text-sm">
            Connecter ma chaîne Twitch
          </a>
        </div>
      )}

      {/* Liste des abonnements EventSub */}
      {configured && login && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Abonnements EventSub</p>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted">
              Aucun abonnement. Clique « Créer les abonnements » après avoir connecté ta chaîne.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {subscriptions.map((s) => {
                const ok = s.status === 'enabled';
                return (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="font-mono text-xs text-foreground">{s.type}</span>
                    <span className="text-xs text-muted">{ok ? 'actif' : s.status}</span>
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      className="ml-auto text-xs text-muted hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Boutons de test */}
      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Tester l’overlay d’alertes</p>
        <div className="flex flex-wrap gap-2">
          {TESTS.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => test(t.type)}
              disabled={pending}
              className="btn-secondary text-sm disabled:opacity-60"
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Ouvre <code>/overlay/alert</code> (carte « Alertes » ci-dessous) dans un onglet pour voir les tests s’afficher.
        </p>
      </div>
    </section>
  );
}
