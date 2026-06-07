'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import { DateTimeInput } from './datetime-input';
import { saveEvent, deleteEvent } from '@/app/admin/actions';

export type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  gameId: string;
  startDate: string; // instant UTC au format ISO ('' si vide)
  endDate: string;
};

/** Création et gestion des événements, séparées par jeu (un onglet par jeu). */
export function AdminCalendarManager({
  games,
  events,
}: {
  games: GameTabInfo[];
  events: AdminEvent[];
}) {
  const [activeGame, setActiveGame] = useState(games[0]?.id);
  if (!activeGame) return <p className="text-muted">Crée d'abord un jeu actif dans l'onglet « Jeux ».</p>;

  const list = events.filter((e) => e.gameId === activeGame);

  return (
    <div>
      <GameTabBar games={games} activeId={activeGame} onSelect={setActiveGame} />

      {/* Nouvel événement pour le jeu sélectionné */}
      <div className="card mb-8 p-5">
        <p className="mb-4 text-sm font-medium text-foreground">Ajouter un événement</p>
        <EventForm gameId={activeGame} />
      </div>

      {/* Événements existants du jeu */}
      <div className="space-y-4">
        {list.length === 0 && <p className="text-muted">Aucun événement pour ce jeu.</p>}
        {list.map((ev) => (
          <div key={ev.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-title">{ev.title}</h3>
              <ActionForm action={deleteEvent.bind(null, ev.id)} success="Événement supprimé">
                <ConfirmButton message="Supprimer cet événement ?">Supprimer</ConfirmButton>
              </ActionForm>
            </div>
            <EventForm gameId={activeGame} event={ev} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventForm({ gameId, event }: { gameId: string; event?: AdminEvent }) {
  return (
    <ActionForm action={saveEvent} success={event ? 'Événement enregistré' : 'Événement ajouté'} className="space-y-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      {/* Le jeu est imposé par l'onglet courant */}
      <input type="hidden" name="gameId" value={gameId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Titre</label>
          <input name="title" required defaultValue={event?.title} className="field" placeholder="Raid Mythique" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" defaultValue={event?.type ?? 'RAID'} className="field">
            <option value="RAID">Raid</option>
            <option value="EVENT">Événement</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Début</label>
          <DateTimeInput name="startDate" defaultValue={event?.startDate} />
        </div>
        <div>
          <label className="label">Fin (optionnel)</label>
          <DateTimeInput name="endDate" defaultValue={event?.endDate} />
        </div>
      </div>

      <div>
        <label className="label">Description (optionnelle)</label>
        <textarea name="description" rows={2} defaultValue={event?.description ?? ''} className="field" placeholder="Détails de l'événement..." />
      </div>

      <button type="submit" className="btn-primary">
        {event ? 'Enregistrer' : "Ajouter l'événement"}
      </button>
    </ActionForm>
  );
}
