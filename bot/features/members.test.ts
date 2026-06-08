import { describe, it, expect } from 'vitest';
import { normalizeKeys, type StructuredRole } from './members';

const WOW = 'wow';
const SWTOR = 'swtor';

// Jeu de rôles structurés minimal (les roleId ne servent pas à normalizeKeys).
function structured(): StructuredRole[] {
  const list: StructuredRole[] = [
    { key: 'gm', name: 'GM', kind: 'gm', gameId: null, gameName: null, roleId: 'r-gm' },
    { key: 'visiteur', name: 'Visiteur', kind: 'visiteur', gameId: null, gameName: null, roleId: 'r-vis' },
  ];
  for (const g of [WOW, SWTOR]) {
    for (const k of ['officier', 'roster', 'membre', 'recrue'] as const) {
      list.push({ key: `${k}:${g}`, name: `${k} ${g}`, kind: k, gameId: g, gameName: g, roleId: `r-${k}-${g}` });
    }
  }
  return list;
}

const norm = (keys: string[]) => normalizeKeys(keys, structured());

describe('normalizeKeys — hiérarchie des grades', () => {
  it('Officier ⟹ Roster + Membre (cumul descendant)', () => {
    expect(norm([`officier:${WOW}`])).toEqual(
      new Set([`officier:${WOW}`, `roster:${WOW}`, `membre:${WOW}`]),
    );
  });

  it('Roster ⟹ Membre', () => {
    expect(norm([`roster:${WOW}`])).toEqual(new Set([`roster:${WOW}`, `membre:${WOW}`]));
  });

  it('Recrue retirée si un grade supérieur du même jeu est présent', () => {
    expect(norm([`recrue:${WOW}`, `membre:${WOW}`])).toEqual(new Set([`membre:${WOW}`]));
  });

  it('Recrue seule est conservée', () => {
    expect(norm([`recrue:${WOW}`])).toEqual(new Set([`recrue:${WOW}`]));
  });

  it('Visiteur retiré dès qu’un grade de jeu (ou GM) est présent', () => {
    expect(norm(['visiteur', `recrue:${WOW}`])).toEqual(new Set([`recrue:${WOW}`]));
    expect(norm(['visiteur', 'gm'])).toEqual(new Set(['gm']));
  });

  it('Visiteur seul est conservé', () => {
    expect(norm(['visiteur'])).toEqual(new Set(['visiteur']));
  });

  it('grades indépendants par jeu', () => {
    expect(norm([`officier:${WOW}`, `recrue:${SWTOR}`])).toEqual(
      new Set([`officier:${WOW}`, `roster:${WOW}`, `membre:${WOW}`, `recrue:${SWTOR}`]),
    );
  });
});
