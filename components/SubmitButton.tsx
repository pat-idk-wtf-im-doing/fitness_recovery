"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  label,
  busyLabel,
}: {
  label: string;
  busyLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? busyLabel : label}
    </button>
  );
}
