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
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-colors disabled:opacity-50"
      >
        {pending ? "Saving..." : "💾 Save current portfolio"}
      </button>
    </form>
  );
}
