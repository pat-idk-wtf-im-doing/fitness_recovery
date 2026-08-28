import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Import</h1>
        <p className="text-sm text-ink-400">
          Bring your old Samsung Notes across. Nothing is saved until you
          confirm the preview.
        </p>
      </header>

      <ImportForm />

      <a
        href="/api/export"
        className="btn-secondary w-full"
        download="recovery-log.json"
      >
        Download a backup (JSON)
      </a>
    </main>
  );
}
