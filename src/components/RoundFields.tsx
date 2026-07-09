import { STAGES, STAGE_LABELS } from "@/lib/constants";

export const inputClasses =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-violet-900";

export const labelClasses =
  "block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300";

export type RoundDefaults = {
  stage?: string;
  date?: string;
  raised?: number;
  postMoney?: number;
  yourCheck?: number;
};

export function RoundFields({
  defaults,
  checkOptional,
}: {
  defaults?: RoundDefaults;
  checkOptional: boolean;
}) {
  return (
    <>
      <div>
        <label className={labelClasses} htmlFor="stage">
          Stage
        </label>
        <select
          id="stage"
          name="stage"
          required
          defaultValue={defaults?.stage ?? ""}
          className={inputClasses}
        >
          <option value="" disabled>
            Select a stage
          </option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses} htmlFor="date">
          Round date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={defaults?.date}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="raised">
          Total raised in round (USD)
        </label>
        <input
          id="raised"
          name="raised"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={defaults?.raised}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="postMoney">
          Post-money valuation (USD)
        </label>
        <input
          id="postMoney"
          name="postMoney"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={defaults?.postMoney}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="yourCheck">
          Your check (USD{checkOptional ? ", 0 if you sat this round out" : ""})
        </label>
        <input
          id="yourCheck"
          name="yourCheck"
          type="number"
          min={checkOptional ? "0" : "1"}
          step="1"
          required
          defaultValue={defaults?.yourCheck}
          className={inputClasses}
        />
      </div>
    </>
  );
}
