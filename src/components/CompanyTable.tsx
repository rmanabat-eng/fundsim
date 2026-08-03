"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SECTORS, STAGES, STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import {
  formatDollars,
  formatPercent,
  formatMultiple,
  formatDate,
} from "@/lib/fund-math";
import { DeleteCompanyButton } from "@/components/DeleteCompanyButton";

export type CompanyRow = {
  id: string;
  name: string;
  sector: string;
  latestStage: string;
  invested: number; // sum of your checks across rounds
  latestPostMoney: number;
  ownershipPct: number; // current, after all dilution
  value: number; // active: ownership × latest post-money; exited: cash proceeds
  multiple: number; // value ÷ invested
  status: "active" | "exited" | "written-off";
  roundCount: number;
  latestDate: string; // ISO
};

type SortKey =
  | "invested"
  | "latestPostMoney"
  | "ownershipPct"
  | "value"
  | "latestDate";
type SortDir = "asc" | "desc";

const headerCell = "py-3 px-4 align-top";
const headerLabel = "text-xs uppercase tracking-wide text-white/60 font-black";
const filterControl =
  "mt-1.5 block w-full rounded-md border-2 border-white/15 bg-white/5 px-2 py-1 text-xs font-normal normal-case tracking-normal text-white/85 focus:border-[color:var(--max-cyan)] focus:outline-none";

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${headerLabel} inline-flex items-center gap-1 hover:text-[color:var(--max-cyan)] transition-colors`}
      title={`Sort by ${label.toLowerCase()}`}
    >
      {label}
      <span className={active ? "text-[color:var(--max-cyan)]" : "text-white/25"}>
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export function CompanyTable({ companies }: { companies: CompanyRow[] }) {
  const [companyFilter, setCompanyFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [roundsFilter, setRoundsFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("latestDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const rows = useMemo(() => {
    const filtered = companies.filter((c) => {
      if (companyFilter && !c.name.toLowerCase().includes(companyFilter.toLowerCase()))
        return false;
      if (sectorFilter !== "All" && c.sector !== sectorFilter) return false;
      if (stageFilter !== "All" && c.latestStage !== stageFilter) return false;
      if (roundsFilter === "single" && c.roundCount !== 1) return false;
      if (roundsFilter === "multiple" && c.roundCount < 2) return false;
      return true;
    });

    const valueOf = (c: CompanyRow): number =>
      sortKey === "latestDate" ? new Date(c.latestDate).getTime() : c[sortKey];

    return filtered.sort((a, b) =>
      sortDir === "asc" ? valueOf(a) - valueOf(b) : valueOf(b) - valueOf(a)
    );
  }, [companies, companyFilter, sectorFilter, stageFilter, roundsFilter, sortKey, sortDir]);

  const isFiltering =
    companyFilter !== "" ||
    sectorFilter !== "All" ||
    stageFilter !== "All" ||
    roundsFilter !== "All";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-white/15 bg-white/5 text-left">
            <th className={headerCell}>
              <span className={headerLabel}>Company</span>
              <input
                type="text"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="Search..."
                className={filterControl}
              />
            </th>
            <th className={headerCell}>
              <span className={headerLabel}>Sector</span>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className={filterControl}
              >
                <option>All</option>
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </th>
            <th className={headerCell}>
              <span className={headerLabel}>Stage</span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className={filterControl}
              >
                <option value="All">All</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </th>
            <th className={headerCell}>
              <SortButton
                label="Invested"
                active={sortKey === "invested"}
                dir={sortDir}
                onClick={() => toggleSort("invested")}
              />
            </th>
            <th className={headerCell}>
              <SortButton
                label="Latest valuation"
                active={sortKey === "latestPostMoney"}
                dir={sortDir}
                onClick={() => toggleSort("latestPostMoney")}
              />
            </th>
            <th className={headerCell}>
              <SortButton
                label="Ownership"
                active={sortKey === "ownershipPct"}
                dir={sortDir}
                onClick={() => toggleSort("ownershipPct")}
              />
            </th>
            <th className={headerCell}>
              <SortButton
                label="Value"
                active={sortKey === "value"}
                dir={sortDir}
                onClick={() => toggleSort("value")}
              />
            </th>
            <th className={headerCell}>
              <span className={headerLabel}>Rounds</span>
              <select
                value={roundsFilter}
                onChange={(e) => setRoundsFilter(e.target.value)}
                className={filterControl}
              >
                <option value="All">All</option>
                <option value="single">First round only</option>
                <option value="multiple">Has follow-ons</option>
              </select>
            </th>
            <th className={headerCell}>
              <SortButton
                label="Last round"
                active={sortKey === "latestDate"}
                dir={sortDir}
                onClick={() => toggleSort("latestDate")}
              />
            </th>
            <th className={headerCell}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="py-10 text-center text-white/60">
                {isFiltering ? (
                  "No companies match your filters."
                ) : (
                  <>
                    No companies yet.{" "}
                    <Link
                      href="/companies/new"
                      className="text-[color:var(--max-cyan)] underline"
                    >
                      Back your first one
                    </Link>
                    .
                  </>
                )}
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <tr
              key={c.id}
              className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-4 font-medium">
                <Link
                  href={`/companies/${c.id}`}
                  className="text-white hover:text-[color:var(--max-cyan)] hover:underline"
                >
                  {c.name}
                </Link>
                {c.status !== "active" && (
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "exited"
                        ? "bg-[color:var(--max-cyan)]/20 text-[color:var(--max-cyan)]"
                        : "bg-[color:var(--max-orange)]/20 text-[color:var(--max-orange)]"
                    }`}
                  >
                    {c.status === "exited" ? "Exited" : "Written off"}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    SECTOR_STYLES[c.sector] ?? "bg-white/10 text-white/80"
                  }`}
                >
                  {c.sector}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    STAGE_STYLES[c.latestStage] ?? "bg-white/10 text-white/80 ring-white/25"
                  }`}
                >
                  {STAGE_LABELS[c.latestStage as keyof typeof STAGE_LABELS] ??
                    c.latestStage}
                </span>
              </td>
              <td className="py-3 px-4 text-white/75">{formatDollars(c.invested)}</td>
              <td className="py-3 px-4 text-white/75">
                {formatDollars(c.latestPostMoney)}
              </td>
              <td className="py-3 px-4 font-semibold text-[color:var(--max-magenta)]">
                {formatPercent(c.ownershipPct)}
              </td>
              <td className="py-3 px-4 text-white/75">
                {formatDollars(c.value)}
                <span
                  className={`ml-2 text-xs font-medium ${
                    c.multiple >= 1
                      ? "text-[color:var(--max-cyan)]"
                      : "text-[color:var(--max-orange)]"
                  }`}
                >
                  {formatMultiple(c.multiple)}
                </span>
              </td>
              <td className="py-3 px-4 text-white/60">{c.roundCount}</td>
              <td className="py-3 px-4 text-white/60">
                {formatDate(new Date(c.latestDate))}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3 justify-end">
                  <Link
                    href={`/companies/${c.id}`}
                    className="text-xs font-bold text-[color:var(--max-cyan)] hover:underline"
                  >
                    Rounds
                  </Link>
                  <DeleteCompanyButton id={c.id} companyName={c.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
