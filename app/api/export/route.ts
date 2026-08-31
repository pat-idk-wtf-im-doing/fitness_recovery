import { isUnlocked } from "@/lib/auth";
import { listEntries, listFieldDefinitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  // Return a status rather than redirecting: this endpoint is fetched directly.
  if (!(await isUnlocked())) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

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
