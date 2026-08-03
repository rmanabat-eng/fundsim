"use client";

import { useActionState, useRef, useEffect } from "react";
import { saveScenario } from "@/app/actions";
import { inputClasses } from "@/components/RoundFields";

export function SaveScenarioForm() {
  const [state, formAction, pending] = useActionState(saveScenario, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the name after a successful save (state is null on success).
  useEffect(() => {
    if (state === null && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-3">
      <div className="flex-1 max-w-xs">
        <input
          name="name"
          type="text"
          required
          maxLength={40}
          placeholder="Name this scenario, e.g. “Spray and pray”"
          className={inputClasses}
        />
        {state?.error && (
          <p className="mt-1 text-xs text-[color:var(--max-orange)]" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "💾 Save current portfolio"}
      </button>
    </form>
  );
}
