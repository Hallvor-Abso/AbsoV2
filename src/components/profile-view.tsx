'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CLASSES,
  ROLE_EMOJI,
  ROLE_LABEL,
  ROLE_ORDER,
  findClass,
  gameKey,
  type SpecRole,
} from '@/lib/classes';
import { setMyMain } from '@/app/(public)/profil/actions';

export type ProfileGame = {
  id: string;
  name: string;
  slug: string;
  color: string;
  status: 'ACTIVE' | 'UPCOMING';
};
export type ProfileMain = { classId: string; className: string; specId: string; spec: string; role: string };

export function ProfileView({
  account,
  games,
  myMains,
  showApplications = true,
}: {
  account: { name: string; email: string | null; discord: string | null; discordLinked: boolean };
  games: ProfileGame[];
  myMains: Record<string, ProfileMain>;
  showApplications?: boolean;
}) {
  // Seuls les jeux à classes (WoW/SWTOR) ont un éditeur de main.
  const classGames = games.filter((g) => gameKey(g.slug) || gameKey(g.name));

  return (
    <div className="space-y-8">
      {/* Compte */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-title">{account.name}</h2>
        <p className="mt-1 text-sm text-muted">{account.email || '—'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {account.discordLinked ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              ✓ Discord lié{account.discord ? ` · ${account.discord}` : ''}
            </span>
          ) : (
            <>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                Discord non lié
              </span>
              <a href="/api/discord/link" className="btn-primary py-1.5 text-sm">Lier mon compte Discord</a>
            </>
          )}
        </div>
      </div>

      {/* Mes classes par jeu */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-title">Mes classes</h2>
        {!account.discordLinked ? (
          <p className="card p-5 text-sm text-muted">
            Lie ton compte Discord pour enregistrer ta classe et ta spé par jeu.
          </p>
        ) : classGames.length === 0 ? (
          <p className="card p-5 text-sm text-muted">Aucun jeu à classes pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {classGames.map((g) => (
              <GameMainCard key={g.id} game={g} main={myMains[g.id] ?? null} />
            ))}
          </div>
        )}
      </div>

      {/* Liens rapides */}
      <div className="flex flex-wrap gap-3">
        {showApplications && (
          <Link href="/mes-candidatures" className="btn-secondary text-sm">Mes candidatures</Link>
        )}
        <Link href="/calendrier" className="btn-secondary text-sm">Calendrier</Link>
      </div>
    </div>
  );
}

/** Éditeur de la classe-spé (WoW) ou classe-rôle (SWTOR) d'un jeu. */
function GameMainCard({ game, main }: { game: ProfileGame; main: ProfileMain | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const key = (gameKey(game.slug) ?? gameKey(game.name))!;
  const isWow = key === 'wow';

  const [classId, setClassId] = useState(main?.classId ?? CLASSES[key][0].id);
  const cls = findClass(key, classId) ?? CLASSES[key][0];
  const [choice, setChoice] = useState<string>(isWow ? main?.specId || cls.specs[0].id : main?.role || 'DPS');

  const onClass = (id: string) => {
    setClassId(id);
    if (isWow) {
      const c = findClass(key, id);
      if (c) setChoice(c.specs[0].id);
    }
  };

  const save = () =>
    startTransition(async () => {
      setMsg(null);
      const res = await setMyMain(game.id, classId, choice);
      if ('error' in res) setMsg(res.error);
      else {
        setMsg('Enregistré ✓');
        router.refresh();
      }
    });

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: game.color }} />
          {game.name}
        </span>
        {main && (
          <span className="text-xs text-muted">
            {ROLE_EMOJI[main.role as SpecRole]} {main.className}
            {main.spec ? ` · ${main.spec}` : ` · ${ROLE_LABEL[main.role as SpecRole] ?? main.role}`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={classId} onChange={(e) => onClass(e.target.value)} className="field max-w-[11rem] py-1.5 text-sm">
          {CLASSES[key].map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        {isWow ? (
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className="field max-w-[13rem] py-1.5 text-sm">
            {cls.specs.map((s) => (
              <option key={s.id} value={s.id}>{s.label} ({ROLE_LABEL[s.role]})</option>
            ))}
          </select>
        ) : (
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className="field max-w-[13rem] py-1.5 text-sm">
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>{ROLE_EMOJI[r]} {ROLE_LABEL[r]}</option>
            ))}
          </select>
        )}
        <button type="button" disabled={pending} onClick={save} className="btn-primary py-1.5 text-sm disabled:opacity-50">
          Enregistrer
        </button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  );
}
