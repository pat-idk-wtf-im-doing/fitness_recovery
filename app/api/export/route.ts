import { listEntries, listFieldDefinitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [entries, fields] = await Promise.all([
    listEntries(),
    listFieldDefinitions(),
  ]);

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), fields, entries },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="recovery-log.json"',
      "Cache-Control": "no-store",
    },
  });
}
