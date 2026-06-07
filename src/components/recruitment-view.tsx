'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SLOT_STATUS } from '@/lib/labels';
import { GameTabBar, type GameTabInfo } from './game-tab-bar';
import { ApplicationForm } from './application-form';
import { SectionHeading } from './section-heading';
import { DEFAULT_RECRUIT_FIELDS, type FormFieldDef } from '@/lib/recruitment-fields';

export type RecruitSlot = {
  id: string;
  gameId: string;
  role: string;
  className: string;
  status: keyof typeof SLOT_STATUS;
};

export type RecruitRole = {
  id: string;
  gameId: string;
  name: string;
  description: string | null;
};

export type RecruitField = FormFieldDef & { gameId: string };

/**
 * Affichage du recrutement, lisible et par jeu :
 * - onglets pour distinguer les jeux
 * - postes regroupés par RÔLE, avec une pastille de statut claire par classe
 */
export type RecruitAuth = { loggedIn: boolean; discordLinked: boolean; discord: string | null };

export function RecruitmentView({
  games,
  slots,
  roles: roleCategories = [],
  fields = [],
  initialGameId = null,
  auth,
}: {
  games: GameTabInfo[];
  slots: RecruitSlot[];
  roles?: RecruitRole[];
  fields?: RecruitField[];
  initialGameId?: string | null;
  auth: RecruitAuth;
}) {
  const [activeId, setActiveId] = useState<string | null>(initialGameId ?? null);
  const activeGame = activeId ? games.find((g) => g.id === activeId) ?? null : null;

  // Aucun jeu sélectionné → écran de choix neutre (pas de jeu imposé).
  if (!activeGame) {
    if (games.length === 0) return null;
    return <GameChooser games={games} onSelect={setActiveId} />;
  }

  const gameSlots = slots.filter((s) => s.gameId === activeGame.id);
  const gameRoles = roleCategories.filter((r) => r.gameId === activeGame.id);
  // Champs du formulaire du jeu, ou jeu de champs par défaut s'il n'a rien défini.
  const customFields = fields.filter((f) => f.gameId === activeGame.id);
  const gameFields: FormFieldDef[] = customFields.length > 0 ? customFields : DEFAULT_RECRUIT_FIELDS;

  // Ordre des rôles : catégories déclarées d'abord, puis d'éventuels rôles
  // orphelins issus d'anciens postes, dans leur ordre d'apparition.
  const roles: string[] = gameRoles.map((r) => r.name);
  for (const s of gameSlots) if (!roles.includes(s.role)) roles.push(s.role);
  const descriptionOf = (name: string) =>
    gameRoles.find((r) => r.name === name)?.description ?? null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setActiveId(null)}
        className="mb-4 text-sm text-muted transition-colors hover:text-accent"
      >
        ← Choisir un autre jeu
      </button>
      <GameTabBar games={games} activeId={activeGame.id} onSelect={setActiveId} />

      {/* ---- Postes recherchés pour le jeu sélectionné ---- */}
      {roles.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          {activeGame.status === 'UPCOMING'
            ? `Le recrutement sur ${activeGame.name} ouvrira prochainement.`
            : 'Aucun poste ouvert pour le moment.'}
        </div>
      ) : (
        <div className="space-y-5">
          {roles.map((role) => {
            const roleSlots = gameSlots.filter((s) => s.role === role);
            const description = descriptionOf(role);
            return (
              <div key={role} className="card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {role}
                </h3>
                {description && (
                  <p className="mt-1.5 mb-3 text-sm text-foreground/80">{description}</p>
                )}
                <div className={`flex flex-wrap gap-2.5 ${description ? '' : 'mt-4'}`}>
                  {roleSlots.map((slot) => {
                    const meta = SLOT_STATUS[slot.status];
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${meta.badge}`}
                      >
                        <span className="text-sm font-semibold text-title">{slot.className}</span>
                        <span className="text-xs font-medium uppercase tracking-wider opacity-90">
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                  {roleSlots.length === 0 && (
                    <span className="text-sm text-muted">Aucune classe ouverte pour le moment.</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Légende des statuts */}
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted">
            <Legend className="bg-accent" label="Ouvert" />
            <Legend className="bg-amber-400" label="Limité" />
            <Legend className="bg-muted" label="Fermé" />
          </div>
        </div>
      )}

      {/* ---- Formulaire de candidature, propre au jeu sélectionné ---- */}
      <div className="mt-16">
        <SectionHeading
          eyebrow="Postuler"
          title={`Candidature — ${activeGame.name}`}
          subtitle="Prends le temps de remplir chaque champ : une candidature soignée fait la différence."
          className="mb-8"
        />
        {activeGame.status === 'ACTIVE' ? (
          <ApplicationForm gameId={activeGame.id} gameName={activeGame.name} fields={gameFields} auth={auth} />
        ) : (
          <div className="card p-10 text-center text-muted">
            Les candidatures pour {activeGame.name} ouvriront au lancement du projet.
          </div>
        )}
      </div>
    </div>
  );
}

/** Écran de choix du jeu : aucune préférence imposée, une carte par jeu. */
function GameChooser({
  games,
  onSelect,
}: {
  games: GameTabInfo[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="py-4">
      <p className="mb-6 text-center text-lg font-medium text-foreground">
        Pour quel jeu veux-tu postuler ?
      </p>
      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className="group relative flex min-h-[170px] flex-col justify-end overflow-hidden rounded-2xl border border-border text-left transition-all duration-300 hover:border-accent/60 hover:shadow-glow"
            style={{ borderColor: `${g.color}55` }}
          >
            {/* Image de couverture du jeu (assombrie) */}
            {g.coverImageUrl ? (
              <Image
                src={g.coverImageUrl}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 360px"
                className="object-cover opacity-45 transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
              />
            ) : (
              <span className="absolute inset-0" style={{ backgroundColor: `${g.color}22` }} />
            )}
            {/* Dégradé pour la lisibilité du texte */}
            <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/20" />

            <div className="relative flex items-center gap-3 p-5">
              {g.logoUrl ? (
                <span className="relative h-9 w-9 shrink-0">
                  <Image src={g.logoUrl} alt="" fill unoptimized className="object-contain" />
                </span>
              ) : (
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
              )}
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-title transition-colors group-hover:text-accent">
                  {g.name}
                </p>
                {g.status === 'UPCOMING' ? (
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-300">
                    Bientôt
                  </span>
                ) : (
                  <span className="text-sm text-muted">Voir les postes &amp; postuler →</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
