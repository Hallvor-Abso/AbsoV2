'use client';

import { ActionForm } from './action-form';
import { saveTwitchModConfig } from '@/app/admin/actions';

export type TwitchModConfig = {
  blockLinks: boolean;
  permitSeconds: number;
  capsEnabled: boolean;
  capsMinLength: number;
  capsPercent: number;
  blacklist: string[];
  timeoutSeconds: number;
  warnMessage: string | null;
  modsImmune: boolean;
};

export function AdminTwitchMod({ config }: { config: TwitchModConfig }) {
  return (
    <ActionForm action={saveTwitchModConfig} success="Modération enregistrée" className="card space-y-5 p-5">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="blockLinks" defaultChecked={config.blockLinks} className="h-4 w-4 accent-[#4A9EFF]" />
        Bloquer les liens <span className="text-xs text-muted">(les mods font <code>!permit @pseudo</code> pour autoriser)</span>
      </label>
      <div>
        <label className="label">Durée du « permit » (s)</label>
        <input name="permitSeconds" type="number" min={5} max={3600} defaultValue={config.permitSeconds} className="field max-w-[8rem] py-1.5 text-sm" />
      </div>

      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="capsEnabled" defaultChecked={config.capsEnabled} className="h-4 w-4 accent-[#4A9EFF]" />
          Sanctionner l'excès de majuscules
        </label>
        <div className="mt-2 flex flex-wrap gap-4">
          <div>
            <label className="label">Longueur min.</label>
            <input name="capsMinLength" type="number" min={1} max={500} defaultValue={config.capsMinLength} className="field max-w-[7rem] py-1.5 text-sm" />
          </div>
          <div>
            <label className="label">% de majuscules</label>
            <input name="capsPercent" type="number" min={10} max={100} defaultValue={config.capsPercent} className="field max-w-[7rem] py-1.5 text-sm" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <label className="label">Mots interdits (un par ligne ou séparés par des virgules)</label>
        <textarea name="blacklist" rows={3} defaultValue={config.blacklist.join('\n')} className="field text-sm" placeholder="insulte1&#10;insulte2" />
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border pt-4">
        <div>
          <label className="label">Timeout (s)</label>
          <input name="timeoutSeconds" type="number" min={1} max={1209600} defaultValue={config.timeoutSeconds} className="field max-w-[8rem] py-1.5 text-sm" />
        </div>
        <div className="flex-1">
          <label className="label">Message d'avertissement (optionnel)</label>
          <input name="warnMessage" defaultValue={config.warnMessage ?? ''} placeholder="Pas de liens / langage correct svp." className="field py-1.5 text-sm" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="modsImmune" defaultChecked={config.modsImmune} className="h-4 w-4 accent-[#4A9EFF]" />
        Les modérateurs sont immunisés
      </label>

      <button type="submit" className="btn-primary">Enregistrer la modération</button>
    </ActionForm>
  );
}
