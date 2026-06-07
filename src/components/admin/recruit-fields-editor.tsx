'use client';

import { useState } from 'react';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import {
  createRecruitField,
  updateRecruitField,
  deleteRecruitField,
  moveRecruitField,
  seedDefaultRecruitFields,
} from '@/app/admin/actions';
import { FIELD_TYPE_LABELS, FIELD_TYPES, type RecruitFieldType } from '@/lib/recruitment-fields';

export type AdminField = {
  id: string;
  key: string;
  label: string;
  type: RecruitFieldType;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  options: string[];
};

/**
 * Éditeur du formulaire de candidature d'un jeu : ajout / édition / réordon-
 * nancement / suppression des champs personnalisés. Les champs Pseudo et
 * Discord sont toujours présents (non gérés ici) car liés au compte.
 */
export function RecruitFieldsEditor({ gameId, fields }: { gameId: string; fields: AdminField[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-12">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-title">Formulaire de candidature</h3>
          <p className="text-sm text-muted">
            Champs demandés au candidat pour ce jeu. <strong>Pseudo</strong> et{' '}
            <strong>Discord</strong> sont toujours présents.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fields.length === 0 && (
            <ActionForm action={seedDefaultRecruitFields.bind(null, gameId)} success="Champs par défaut créés">
              <button type="submit" className="btn-secondary py-2 text-sm">Partir des champs par défaut</button>
            </ActionForm>
          )}
          <button onClick={() => setAdding((v) => !v)} className="btn-primary py-2 text-sm">
            + Nouveau champ
          </button>
        </div>
      </div>

      {/* Ajout d'un champ */}
      {adding && (
        <div className="card mb-4 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Nouveau champ</p>
          <ActionForm action={createRecruitField} success="Champ ajouté" onDone={() => setAdding(false)}>
            <input type="hidden" name="gameId" value={gameId} />
            <FieldFormBody />
            <div className="mt-3 flex gap-2">
              <button type="submit" className="btn-primary py-2 text-sm">Ajouter le champ</button>
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary py-2 text-sm">Annuler</button>
            </div>
          </ActionForm>
        </div>
      )}

      {fields.length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">
          Aucun champ personnalisé : le formulaire par défaut est utilisé. Crée des champs pour l'adapter à ce jeu.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={field.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {FIELD_TYPE_LABELS[field.type]}
                  {field.required && <span className="ml-2 text-accent">requis</span>}
                </span>
                <div className="flex items-center gap-1">
                  <MoveButton id={field.id} direction="up" disabled={i === 0} />
                  <MoveButton id={field.id} direction="down" disabled={i === fields.length - 1} />
                </div>
              </div>

              <ActionForm action={updateRecruitField} success="Champ enregistré">
                <input type="hidden" name="id" value={field.id} />
                <FieldFormBody field={field} />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button type="submit" className="btn-primary py-2 text-sm">💾 Sauvegarder</button>
                </div>
              </ActionForm>

              <div className="mt-3 border-t border-border pt-3">
                <ActionForm action={deleteRecruitField.bind(null, field.id)} success="Champ supprimé">
                  <ConfirmButton
                    className="text-xs text-red-300 hover:text-red-200"
                    message={`Supprimer le champ « ${field.label} » ?`}
                  >
                    Supprimer le champ
                  </ConfirmButton>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoveButton({ id, direction, disabled }: { id: string; direction: 'up' | 'down'; disabled: boolean }) {
  if (disabled) {
    return <span className="px-2 py-1 text-sm text-muted/40">{direction === 'up' ? '↑' : '↓'}</span>;
  }
  return (
    <ActionForm action={moveRecruitField.bind(null, id, direction)} success="Ordre mis à jour">
      <button type="submit" className="rounded px-2 py-1 text-sm text-muted hover:text-accent" title="Déplacer">
        {direction === 'up' ? '↑' : '↓'}
      </button>
    </ActionForm>
  );
}

/** Corps de formulaire commun (création + édition). */
function FieldFormBody({ field }: { field?: AdminField }) {
  const [type, setType] = useState<RecruitFieldType>(field?.type ?? 'TEXT');
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Libellé *</label>
          <input name="label" required defaultValue={field?.label} placeholder="Ex : Classe principale" className="field py-2 text-sm" />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as RecruitFieldType)}
            className="field py-2 text-sm"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Texte d'exemple (placeholder)</label>
        <input name="placeholder" defaultValue={field?.placeholder ?? ''} placeholder="Indication affichée en gris dans le champ" className="field py-2 text-sm" />
      </div>

      <div>
        <label className="label">Aide (sous le champ)</label>
        <input name="helpText" defaultValue={field?.helpText ?? ''} placeholder="Précision optionnelle" className="field py-2 text-sm" />
      </div>

      {type === 'SELECT' && (
        <div>
          <label className="label">Options de la liste</label>
          <textarea
            name="options"
            rows={3}
            defaultValue={field?.options.join('\n') ?? ''}
            placeholder="Une option par ligne (ou séparées par des virgules)"
            className="field text-sm"
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="required" defaultChecked={field?.required ?? false} className="h-4 w-4 rounded border-border" />
        Champ obligatoire
      </label>
    </div>
  );
}
