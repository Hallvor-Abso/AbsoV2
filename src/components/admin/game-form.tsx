'use client';

import { ActionForm } from './action-form';
import { ImageInput } from './image-input';
import { saveGame } from '@/app/admin/actions';

export type GameFormValues = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  color: string;
  status: string;
  isActive: boolean;
  order: number;
  discordCalendarChannelId: string | null;
  discordRecruitmentChannelId: string | null;
  discordRecruitmentCategoryId: string | null;
  discordRoleTag: string | null;
};

/** Formulaire de création/édition d'un jeu. */
export function GameForm({ game, onDone }: { game?: GameFormValues; onDone?: () => void }) {
  return (
    <ActionForm
      action={saveGame}
      success={game ? 'Jeu enregistré' : 'Jeu ajouté'}
      className="mt-4 space-y-4"
      onDone={onDone}
    >
      {game && <input type="hidden" name="id" value={game.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nom du jeu</label>
          <input name="name" required defaultValue={game?.name} className="field" placeholder="World of Warcraft" />
        </div>
        <div>
          <label className="label">Identifiant URL (slug)</label>
          <input name="slug" defaultValue={game?.slug} className="field" placeholder="wow (laisser vide = auto)" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageInput name="logoUrl" defaultValue={game?.logoUrl ?? ''} label="Logo du jeu" />
        <ImageInput name="coverImageUrl" defaultValue={game?.coverImageUrl ?? ''} label="Image de fond (art officiel)" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Couleur d'accent</label>
          <input name="color" type="color" defaultValue={game?.color ?? '#4A9EFF'} className="field h-11 p-1" />
        </div>
        <div>
          <label className="label">Statut</label>
          <select name="status" defaultValue={game?.status ?? 'ACTIVE'} className="field">
            <option value="ACTIVE">Actif (jouable)</option>
            <option value="UPCOMING">À venir</option>
          </select>
        </div>
        <div>
          <label className="label">Ordre d'affichage</label>
          <input name="order" type="number" defaultValue={game?.order ?? 0} className="field" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isActive" defaultChecked={game?.isActive ?? true} className="h-4 w-4 accent-[#4A9EFF]" />
        Visible sur le site public
      </label>

      <div>
        <label className="label">Tag des rôles Discord</label>
        <input
          name="discordRoleTag"
          defaultValue={game?.discordRoleTag ?? ''}
          className="field"
          placeholder="ex : WOW (laisser vide = déduit du slug)"
        />
        <p className="mt-1 text-xs text-muted">
          Suffixe des rôles Discord du jeu. Avec « WOW », le bot pingue{' '}
          <strong>@GM</strong>, <strong>@Officier WOW</strong>, <strong>@Roster WOW</strong>,{' '}
          <strong>@Membre WOW</strong>, <strong>@Recrue WOW</strong> sur les événements (et
          @GM + @Officier WOW sur les candidatures). Les rôles sont retrouvés par leur nom :
          crée-les sur Discord et le bot s'y adapte automatiquement.
        </p>
      </div>

      <div>
        <label className="label">Salon Discord du calendrier (ID)</label>
        <input
          name="discordCalendarChannelId"
          defaultValue={game?.discordCalendarChannelId ?? ''}
          className="field"
          placeholder="ex : 123456789012345678 (laisser vide = pas de publication Discord)"
        />
        <p className="mt-1 text-xs text-muted">
          Le bot publie les événements de ce jeu dans ce salon. Mode développeur Discord →
          clic droit sur le salon → « Copier l'identifiant ».
        </p>
      </div>

      <div>
        <label className="label">Catégorie Discord des candidatures (ID)</label>
        <input
          name="discordRecruitmentCategoryId"
          defaultValue={game?.discordRecruitmentCategoryId ?? ''}
          className="field"
          placeholder="ex : 123456789012345678 (ID d'une CATÉGORIE)"
        />
        <p className="mt-1 text-xs text-muted">
          <strong>Recommandé.</strong> Pour chaque candidature, le bot crée un salon dédié
          « candid-pseudo » dans cette catégorie. (Le bot doit avoir la permission
          « Gérer les salons ».)
        </p>
      </div>

      <div>
        <label className="label">…ou salon unique des candidatures (ID)</label>
        <input
          name="discordRecruitmentChannelId"
          defaultValue={game?.discordRecruitmentChannelId ?? ''}
          className="field"
          placeholder="ex : 123456789012345678 (utilisé si aucune catégorie ci-dessus)"
        />
        <p className="mt-1 text-xs text-muted">
          Mode simple : toutes les candidatures sont publiées dans ce salon unique.
          Ignoré si une catégorie est renseignée au-dessus.
        </p>
      </div>

      <button type="submit" className="btn-primary">
        {game ? 'Enregistrer' : 'Ajouter le jeu'}
      </button>
    </ActionForm>
  );
}
