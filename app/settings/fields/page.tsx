import { lock } from "@/app/actions/auth";
import { setFieldActive } from "@/app/actions/fields";
import { listFieldDefinitions } from "@/lib/queries";

import { NewFieldForm } from "./NewFieldForm";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  number: "Number",
  scale: "Scale 0–10",
  select: "Choice",
  text: "Text",
};

export default async function FieldsPage() {
  const fields = await listFieldDefinitions();

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your fields</h1>
        <p className="text-sm text-ink-400">
          Extras on top of pain, steps, carbs and intensity.
        </p>
      </header>

      <NewFieldForm />

      {fields.length > 0 ? (
        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="card flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {field.label}
                  {field.unit ? (
                    <span className="text-ink-400"> ({field.unit})</span>
                  ) : null}
                </p>
                <p className="text-sm text-ink-400">
                  {TYPE_LABELS[field.type] ?? field.type}
                  {field.type === "select" && field.options.length > 0
                    ? ` · ${field.options.join(", ")}`
                    : ""}
                  {field.active ? "" : " · hidden"}
                </p>
              </div>
              <form action={setFieldActive}>
                <input type="hidden" name="id" value={field.id} />
                <input
                  type="hidden"
                  name="active"
                  value={field.active ? "false" : "true"}
                />
                <button type="submit" className="btn-secondary text-sm">
                  {field.active ? "Hide" : "Show"}
                </button>
              </form>
            </div>
          ))}
          <p className="px-1 text-xs text-ink-400">
            Hiding a field removes it from the form but keeps every value you
            have already logged.
          </p>
        </div>
      ) : null}

      <form action={lock} className="pt-2">
        <button type="submit" className="btn-secondary w-full">
          Lock app
        </button>
      </form>
    </main>
  );
}
