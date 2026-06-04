import { put } from '@vercel/blob';
import { getAppUser } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/permissions';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo

/**
 * Téléversement d'image (réservé aux admins) vers Vercel Blob.
 * Retourne `{ url }` ; l'URL publique est ensuite enregistrée dans le champ
 * correspondant (logo, image de boss, couverture de news…).
 */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user || !canAccessAdmin(user)) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Stockage d'images non configuré (BLOB_READ_WRITE_TOKEN manquant). Colle une URL à la place." },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return Response.json({ error: 'Seules les images sont acceptées.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image trop lourde (max 4 Mo)." }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const blob = await put(key, file, { access: 'public', contentType: file.type });

  return Response.json({ url: blob.url });
}
