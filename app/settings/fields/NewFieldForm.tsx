"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { createField, type FieldFormState } from "@/app/actions/fields";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Adding…" : "Add field"}
    </button>
  );
}

export function NewFieldForm() {
  const [state, formAction] = useActionState<FieldFormState, FormData>(
    createField,
    {},
  );
  const [type, setType] = useState("number");

  return (
    <form action={formAction} className="card space-y-4">
      <p className="text-sm font-medium text-ink-300">Add a field</p>

      <div>
        <label htmlFor="label" className="label">
          Name
        </label>
        <input
          id="label"
          name="label"
          className="input"
          placeholder="e.g. Protein, Massage, Pitch type"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="type" className="label">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="input"
          >
            <option value="number">Number</option>
            <option value="scale">Scale 0–10</option>
            <option value="select">Choice</option>
            <option value="text">Text</option>
          </select>
        </div>
        <div>
          <label htmlFor="unit" className="label">
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            className="input"
            placeholder="g, min, km"
            disabled={type !== "number"}
          />
        </div>
      </div>

      {type === "select" ? (
        <div>
          <label htmlFor="options" className="label">
            Choices
          </label>
          <input
            id="options"
            name="options"
            className="input"
            placeholder="Grass, 3G, Indoor"
          />
          <p className="mt-1.5 text-xs text-ink-400">Separate with commas.</p>
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-accent">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
