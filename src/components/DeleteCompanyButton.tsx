"use client";

import { useState, useTransition } from "react";
import { deleteCompany } from "@/app/actions";

export function DeleteCompanyButton({
  id,
  companyName,
}: {
  id: string;
  companyName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <span className="text-xs text-white/60">
          Delete {companyName} and all its rounds?
        </span>
        <button
          onClick={() => startTransition(() => deleteCompany(id))}
          disabled={pending}
          className="text-xs font-bold text-[color:var(--max-orange)] hover:underline disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-bold text-white/60 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-bold text-[color:var(--max-orange)] hover:underline"
    >
      Delete
    </button>
  );
}
