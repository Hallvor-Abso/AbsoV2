/** Écran de chargement global (affiché pendant la navigation/Suspense). */
export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
