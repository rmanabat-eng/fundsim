import { STAGES, STAGE_LABELS } from "@/lib/constants";

// Dark by default now — every remaining consumer (company/round/exit forms,
// the campaign's decision cards) lives on the maximalist skin, so this no
// longer needs to double as a light-mode input.
export const inputClasses =
  "w-full rounded-lg border-2 border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-[color:var(--max-cyan)] focus:outline-none focus:ring-2 focus:ring-[color:var(--max-cyan)]/30 transition-colors";

export const labelClasses = "block text-sm font-bold mb-1 text-white/75";

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
