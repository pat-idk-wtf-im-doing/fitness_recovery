"use client";

import { useActionState } from "react";

import { unlock, type LoginState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(unlock, {});

  return (
    <form action={formAction} className="card space-y-4">
      <div>
        <label htmlFor="pin" className="label">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          className="input"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          required
        />
        {state.error ? <p className="field-error">{state.error}</p> : null}
      </div>

      <SubmitButton label="Unlock" busyLabel="Checking…" />
    </form>
  );
}
