'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/admin/toast';
import { saveOverlayConfig } from '@/app/admin/actions';
import type { OverlayConfig } from '@/lib/overlay-config';

/**
 * Hub de configuration des overlays de stream (Super Admin).
 *
 * On décrit chaque overlay de façon déclarative (paramètres partagés + propres),
 * et le composant génère automatiquement l'URL OBS, la copie, l'ouvre, et offre
 * un aperçu live. Pour ajouter un overlay : compléter le catalogue `OVERLAYS`.
 */

type FieldDef = {
  param: string;
  label: string;
  kind: 'text' | 'number' | 'toggle';
  placeholder?: string;
  help?: string;
  /** toggle : valeur émise quand activé (sinon rien). */
  on?: string;
  /** toggle : valeur émise quand désactivé (sinon rien). */
  off?: string;
  /** toggle : état par défaut. */
  defaultOn?: boolean;
};

// Paramètres communs à plusieurs overlays : réglés une seule fois en haut de page.
const SHARED: Record<string, FieldDef> = {
  name: { param: 'name', label: 'Pseudo', kind: 'text', placeholder: 'Hallvor' },
  twitch: { param: 'twitch', label: 'Twitch (pseudo)', kind: 'text', placeholder: 'ton_pseudo' },
  discord: { param: 'discord', label: 'Discord (invitation)', kind: 'text', placeholder: 'discord.gg/abso' },
  siteUrl: { param: 'siteUrl', label: 'URL du site', kind: 'text', placeholder: 'absolution-guild.com' },
  guild: { param: 'guild', label: 'Afficher « Absolution »', kind: 'toggle', defaultOn: true, off: '0' },
  site: { param: 'site', label: 'Afficher le site', kind: 'toggle', defaultOn: false, on: '1' },
  transparent: { param: 'transparent', label: 'Fond transparent', kind: 'toggle', defaultOn: false, on: '1' },
};

type OverlayDef = {
  id: string;
  name: string;
  path: string;
  size: string;
  desc: string;
  shared: (keyof typeof SHARED)[];
  fields: FieldDef[];
};

const OVERLAYS: OverlayDef[] = [
  {
    id: 'starting-soon',
    name: 'Starting soon',
    path: '/overlay/starting-soon',
    size: '1920×1080',
    desc: "Écran d'attente avec compte à rebours avant le live.",
    shared: ['name', 'twitch', 'discord', 'guild', 'site', 'siteUrl', 'transparent'],
    fields: [
      { param: 'title', label: 'Titre', kind: 'text', placeholder: 'Le stream commence bientôt' },
      { param: 'min', label: 'Durée (minutes)', kind: 'number', placeholder: '10' },
    ],
  },
  {
    id: 'brb',
    name: 'Be right back (pause)',
    path: '/overlay/brb',
    size: '1920×1080',
    desc: 'Écran de pause avec compte à rebours avant le retour.',
    shared: ['twitch', 'discord', 'guild', 'site', 'siteUrl', 'transparent'],
    fields: [
      { param: 'title', label: 'Titre', kind: 'text', placeholder: 'Pause' },
      { param: 'subtitle', label: 'Sous-titre', kind: 'text', placeholder: 'Je reviens dans un instant' },
      { param: 'min', label: 'Durée (minutes)', kind: 'number', placeholder: '5' },
    ],
  },
  {
    id: 'ending',
    name: 'Stream ending',
    path: '/overlay/ending',
    size: '1920×1080',
    desc: 'Écran de fin de stream (remerciements).',
    shared: ['twitch', 'discord', 'guild', 'site', 'siteUrl', 'transparent'],
    fields: [
      { param: 'title', label: 'Titre', kind: 'text', placeholder: 'Merci !' },
      { param: 'subtitle', label: 'Sous-titre', kind: 'text', placeholder: "Merci d'avoir suivi le stream — à très vite 👋" },
    ],
  },
  {
    id: 'scene',
    name: 'Habillage de scène',
    path: '/overlay/scene',
    size: '1920×1080 · transparent',
    desc: 'Barre basse esport : logo/guilde à gauche, réseaux (Twitch/Discord) à droite. À superposer au gameplay.',
    shared: ['twitch', 'discord', 'guild', 'site', 'siteUrl'],
    fields: [],
  },
  {
    id: 'camera',
    name: 'Cadre caméra',
    path: '/overlay/camera',
    size: 'format webcam · transparent',
    desc: 'Cadre déplaçable à poser sur ta webcam. Centre transparent par défaut ; active « Visuel sans webcam » pour afficher le logo + un texte quand il n’y a pas de cam.',
    shared: ['name'],
    fields: [
      { param: 'plate', label: 'Afficher la plaque pseudo', kind: 'toggle', defaultOn: true, off: '0' },
      { param: 'fill', label: 'Visuel sans webcam (logo + texte)', kind: 'toggle', defaultOn: false, on: '1' },
      { param: 'label', label: 'Texte si pas de cam', kind: 'text', placeholder: 'Caméra bientôt' },
    ],
  },
  {
    id: 'nameplate',
    name: 'Plaque pseudo',
    path: '/overlay/nameplate',
    size: 'auto · transparent',
    desc: 'Plaque « Pseudo ● LIVE » autonome et déplaçable.',
    shared: ['name'],
    fields: [
      { param: 'live', label: 'Libellé live', kind: 'text', placeholder: 'Live' },
      { param: 'bare', label: 'Sans panneau (texte seul)', kind: 'toggle', defaultOn: false, on: '1' },
    ],
  },
  {
    id: 'badge',
    name: 'Badge logo',
    path: '/overlay/badge',
    size: 'auto · transparent',
    desc: 'Badge avec le logo de la guilde, autonome et déplaçable.',
    shared: ['site', 'siteUrl'],
    fields: [{ param: 'bare', label: 'Sans cadre/fond', kind: 'toggle', defaultOn: false, on: '1' }],
  },
  {
    id: 'ticker',
    name: 'Bandeau d’infos',
    path: '/overlay/ticker',
    size: '1920×… · transparent',
    desc: 'Bandeau défilant en bas : messages perso + infos auto de la guilde (raid, news, boss).',
    shared: ['guild'],
    fields: [
      { param: 'messages', label: 'Messages (séparés par « | »)', kind: 'text', placeholder: 'Salut à tous|GG l’équipe' },
      { param: 'auto', label: 'Infos auto de la guilde', kind: 'toggle', defaultOn: true, off: '0' },
      { param: 'speed', label: 'Vitesse (s/boucle)', kind: 'number', placeholder: '40' },
    ],
  },
  {
    id: 'goal',
    name: 'Barre d’objectif',
    path: '/overlay/goal',
    size: 'auto · transparent',
    desc: 'Jauge d’objectif (abonnés, dons…) avec pourcentage animé.',
    shared: [],
    fields: [
      { param: 'label', label: 'Libellé', kind: 'text', placeholder: 'Objectif abonnés' },
      { param: 'current', label: 'Valeur actuelle', kind: 'number', placeholder: '0' },
      { param: 'target', label: 'Objectif', kind: 'number', placeholder: '100' },
      { param: 'unit', label: 'Unité (optionnel)', kind: 'text', placeholder: '€' },
    ],
  },
  {
    id: 'alert',
    name: 'Alertes (Twitch)',
    path: '/overlay/alert',
    size: 'auto · transparent',
    desc: 'Alertes follow / sub / raid en temps réel. À mettre en plein écran ou dans un coin. Utilise les tests ci-dessus.',
    shared: [],
    fields: [
      { param: 'duration', label: 'Durée (secondes)', kind: 'number', placeholder: '6' },
      { param: 'sound', label: 'Son d’alerte', kind: 'toggle', defaultOn: false, on: '1' },
      { param: 'followMsg', label: 'Message follow', kind: 'text', placeholder: 'vient de suivre la chaîne !' },
      { param: 'subMsg', label: 'Message sub', kind: 'text', placeholder: 's’abonne à la chaîne !' },
      { param: 'raidMsg', label: 'Message raid', kind: 'text', placeholder: 'débarque avec {amount} viewers !' },
    ],
  },
  {
    id: 'kills',
    name: 'Derniers boss vaincus',
    path: '/overlay/kills',
    size: 'auto · transparent',
    desc: 'Liste des derniers boss tombés, alimentée par la progression réelle de la guilde.',
    shared: [],
    fields: [
      { param: 'limit', label: 'Nombre de boss', kind: 'number', placeholder: '5' },
      { param: 'title', label: 'Titre', kind: 'text', placeholder: 'Derniers boss vaincus' },
      { param: 'date', label: 'Afficher les dates', kind: 'toggle', defaultOn: true, off: '0' },
    ],
  },
];

type Val = string | boolean;
type FieldState = Record<string, Val>;

/** Reconstitue l'état d'un champ depuis une valeur sauvegardée (format URL). */
function fieldFromSaved(def: FieldDef, saved?: string): Val {
  if (def.kind === 'toggle') {
    if (saved === undefined) return Boolean(def.defaultOn);
    if (def.on !== undefined) return saved === def.on;
    if (def.off !== undefined) return saved !== def.off;
    return Boolean(def.defaultOn);
  }
  return saved ?? '';
}

function initState(fields: FieldDef[], saved: Record<string, string> = {}): FieldState {
  const s: FieldState = {};
  for (const f of fields) s[f.param] = fieldFromSaved(f, saved[f.param]);
  return s;
}

function serialize(def: FieldDef, val: Val, qs: URLSearchParams) {
  if (def.kind === 'toggle') {
    if (val === true && def.on) qs.set(def.param, def.on);
    if (val === false && def.off) qs.set(def.param, def.off);
  } else {
    const s = String(val ?? '').trim();
    if (s) qs.set(def.param, s);
  }
}

/** Transforme un ensemble de champs + état en dictionnaire { param: valeur }. */
function toMap(fields: FieldDef[], state: FieldState): Record<string, string> {
  const qs = new URLSearchParams();
  for (const f of fields) serialize(f, state[f.param], qs);
  return Object.fromEntries(qs.entries());
}

export function OverlayHub({ initial }: { initial: OverlayConfig }) {
  const toast = useToast();
  const [origin, setOrigin] = useState('');
  const [shared, setShared] = useState<FieldState>(() => initState(Object.values(SHARED), initial.shared));
  const [own, setOwn] = useState<Record<string, FieldState>>(() =>
    Object.fromEntries(OVERLAYS.map((o) => [o.id, initState(o.fields, initial.overlays[o.id])])),
  );
  const [preview, setPreview] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const save = async () => {
    setSaving(true);
    try {
      const config: OverlayConfig = {
        shared: toMap(Object.values(SHARED), shared),
        overlays: Object.fromEntries(OVERLAYS.map((o) => [o.id, toMap(o.fields, own[o.id])])),
      };
      await saveOverlayConfig(JSON.stringify(config));
      toast('Réglages enregistrés — actualise la source dans OBS.');
    } catch {
      toast("Échec de l'enregistrement.", 'error');
    } finally {
      setSaving(false);
    }
  };

  const urls = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ov of OVERLAYS) {
      const qs = new URLSearchParams();
      for (const key of ov.shared) serialize(SHARED[key], shared[key], qs);
      for (const f of ov.fields) serialize(f, own[ov.id][f.param], qs);
      const q = qs.toString();
      map[ov.id] = `${origin}${ov.path}${q ? `?${q}` : ''}`;
    }
    return map;
  }, [origin, shared, own]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast('URL copiée — colle-la dans une Browser Source OBS.');
    } catch {
      toast('Copie impossible (copie manuelle).', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Barre d'action : enregistrer les réglages */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-ink-soft/95 px-4 py-3 backdrop-blur">
        <p className="text-sm text-muted">
          <b className="text-foreground">Enregistre</b> tes réglages : les overlays les utiliseront même avec
          une URL <b>propre</b> (sans paramètres) dans OBS.
        </p>
        <button type="button" onClick={save} disabled={saving} className="btn-primary shrink-0 text-sm disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer les réglages'}
        </button>
      </div>

      {/* Réglages partagés */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Réglages partagés</h2>
        <p className="mt-1 text-sm text-muted">
          Définis ces valeurs une fois : elles s'appliquent automatiquement aux overlays concernés.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(SHARED).map(([key, def]) => (
            <FieldInput
              key={key}
              def={def}
              value={shared[key]}
              onChange={(v) => setShared((s) => ({ ...s, [key]: v }))}
            />
          ))}
        </div>
      </section>

      {/* Aide OBS */}
      <div className="rounded-lg border border-border bg-ink-soft/60 p-4 text-sm text-muted">
        <b className="text-foreground">Dans OBS :</b> Sources → <b>+</b> → <b>Source navigateur</b> → colle l'URL,
        règle la taille indiquée, et coche <i>« Rafraîchir le navigateur quand la scène devient active »</i>.
        <br />
        Après avoir cliqué <b>Enregistrer</b>, tu peux coller l'URL telle quelle : les réglages sont déjà mémorisés
        côté serveur. Les paramètres dans l'URL restent prioritaires (pratique pour ajuster un compte à rebours).
      </div>

      {/* Catalogue */}
      <div className="grid gap-5 lg:grid-cols-2">
        {OVERLAYS.map((ov) => (
          <section key={ov.id} className="card flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-title">{ov.name}</h3>
                <p className="mt-1 text-sm text-muted">{ov.desc}</p>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                {ov.size}
              </span>
            </div>

            {ov.fields.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ov.fields.map((f) => (
                  <FieldInput
                    key={f.param}
                    def={f}
                    value={own[ov.id][f.param]}
                    onChange={(v) => setOwn((s) => ({ ...s, [ov.id]: { ...s[ov.id], [f.param]: v } }))}
                  />
                ))}
              </div>
            )}

            {/* URL générée */}
            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={urls[ov.id]}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-border bg-ink px-3 py-2 font-mono text-xs text-foreground"
              />
              <button type="button" onClick={() => copy(urls[ov.id])} className="btn-primary shrink-0 text-sm">
                Copier
              </button>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm">
              <a href={urls[ov.id]} target="_blank" rel="noreferrer" className="font-medium text-accent hover:text-accent-deep">
                Ouvrir ↗
              </a>
              <button
                type="button"
                onClick={() => setPreview((p) => ({ ...p, [ov.id]: !p[ov.id] }))}
                className="font-medium text-muted hover:text-title"
              >
                {preview[ov.id] ? 'Masquer l’aperçu' : 'Aperçu'}
              </button>
            </div>

            {preview[ov.id] && origin && (
              <div className="mt-4">
                <div className="ovh-preview">
                  <iframe key={urls[ov.id]} src={urls[ov.id]} title={ov.name} className="ovh-frame" />
                </div>
                <p className="mt-1.5 text-xs text-muted">Aperçu approximatif (réduit depuis 1920×1080).</p>
              </div>
            )}
          </section>
        ))}
      </div>

      <style>{`
        .ovh-preview { position: relative; width: 100%; max-width: 384px; aspect-ratio: 16 / 9;
          overflow: hidden; border-radius: 10px; border: 1px solid var(--border, rgba(255,255,255,.1));
          background:
            repeating-conic-gradient(#1a1f29 0% 25%, #12161e 0% 50%) 50% / 22px 22px; }
        .ovh-frame { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px;
          transform: scale(.2); transform-origin: top left; border: 0; pointer-events: none; }
      `}</style>
    </div>
  );
}

function FieldInput({ def, value, onChange }: { def: FieldDef; value: Val; onChange: (v: Val) => void }) {
  if (def.kind === 'toggle') {
    return (
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-ink px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <span className="text-foreground">{def.label}</span>
      </label>
    );
  }
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">{def.label}</span>
      <input
        type={def.kind === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-foreground placeholder:text-muted/60"
      />
    </label>
  );
}
