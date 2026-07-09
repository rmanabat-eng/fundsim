"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SECTORS, STAGES, STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import {
  formatDollars,
  formatPercent,
  formatDate,
  ownershipPercent,
} from "@/lib/fund-math";
import { DeleteInvestmentButton } from "@/components/DeleteInvestmentButton";

export type InvestmentRow = {
  id: string;
  companyName: string;
  sector: string;
  stage: string;
  checkSize: number;
  postMoneyValuation: number;
  investmentDate: string; // ISO string, serialized for the client
};

type SortKey = "checkSize" | "postMoneyValuation" | "ownership" | "investmentDate";
type SortDir = "asc" | "desc";

const headerCell = "py-3 px-4 align-top";
const headerLabel =
  "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold";
const filterControl =
  "mt-1.5 block w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-slate-700 focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

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
      className={`${headerLabel} inline-flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors`}
      title={`Sort by ${label.toLowerCase()}`}
    >
      {label}
      <span className={active ? "text-violet-600 dark:text-violet-400" : "text-slate-300 dark:text-slate-600"}>
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export function InvestmentTable({ investments }: { investments: InvestmentRow[] }) {
  const [companyFilter, setCompanyFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("investmentDate");
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
    const filtered = investments.filter((inv) => {
      if (
        companyFilter &&
        !inv.companyName.toLowerCase().includes(companyFilter.toLowerCase())
      )
        return false;
      if (sectorFilter !== "All" && inv.sector !== sectorFilter) return false;
      if (stageFilter !== "All" && inv.stage !== stageFilter) return false;
      return true;
    });

    const valueOf = (inv: InvestmentRow): number => {
      switch (sortKey) {
        case "checkSize":
          return inv.checkSize;
        case "postMoneyValuation":
          return inv.postMoneyValuation;
        case "ownership":
          return ownershipPercent(inv.checkSize, inv.postMoneyValuation);
        case "investmentDate":
          return new Date(inv.investmentDate).getTime();
      }
    };

    return filtered.sort((a, b) =>
      sortDir === "asc" ? valueOf(a) - valueOf(b) : valueOf(b) - valueOf(a)
    );
  }, [investments, companyFilter, sectorFilter, stageFilter, sortKey, sortDir]);

  const isFiltering =
    companyFilter !== "" || sectorFilter !== "All" || stageFilter !== "All";

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="w-full text-sm bg-white dark:bg-slate-900">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
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
                label="Check size"
                active={sortKey === "checkSize"}
                dir={sortDir}
                onClick={() => toggleSort("checkSize")}
              />
            </th>
            <th className={headerCell}>
              <SortButton
                label="Post-money"
                active={sortKey === "postMoneyValuation"}
                dir={sortDir}
                onClick={() => toggleSort("postMoneyValuation")}
              />
            </th>
            <th className={headerCell}>
              <SortButton
                label="Ownership"
                active={sortKey === "ownership"}
                dir={sortDir}
                onClick={() => toggleSort("ownership")}
              />
            </th>
            <th className={headerCell}>
              <SortButton
                label="Date"
                active={sortKey === "investmentDate"}
                dir={sortDir}
                onClick={() => toggleSort("investmentDate")}
              />
            </th>
            <th className={headerCell}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500 dark:text-slate-400">
                {isFiltering ? (
                  "No investments match your filters."
                ) : (
                  <>
                    No investments yet.{" "}
                    <Link
                      href="/investments/new"
                      className="text-violet-600 underline dark:text-violet-400"
                    >
                      Add your first one
                    </Link>
                    .
                  </>
                )}
              </td>
            </tr>
          )}
          {rows.map((inv) => (
            <tr
              key={inv.id}
              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                {inv.companyName}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    SECTOR_STYLES[inv.sector] ?? "bg-slate-100 text-slate-800"
                  }`}
                >
                  {inv.sector}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    STAGE_STYLES[inv.stage] ?? "bg-slate-100 text-slate-700 ring-slate-300"
                  }`}
                >
                  {STAGE_LABELS[inv.stage as keyof typeof STAGE_LABELS] ?? inv.stage}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                {formatDollars(inv.checkSize)}
              </td>
              <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                {formatDollars(inv.postMoneyValuation)}
              </td>
              <td className="py-3 px-4 font-semibold text-violet-700 dark:text-violet-400">
                {formatPercent(ownershipPercent(inv.checkSize, inv.postMoneyValuation))}
              </td>
              <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                {formatDate(new Date(inv.investmentDate))}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3 justify-end">
                  <Link
                    href={`/investments/${inv.id}/edit`}
                    className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Edit
                  </Link>
                  <DeleteInvestmentButton id={inv.id} companyName={inv.companyName} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
