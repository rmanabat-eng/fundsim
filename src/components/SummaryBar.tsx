import { FUND_SIZE } from "@/lib/constants";
import { formatDollars } from "@/lib/fund-math";

export function SummaryBar({
  deployed,
  count,
}: {
  deployed: number;
  count: number;
}) {
  const remaining = FUND_SIZE - deployed;

  const stats = [
    { label: "Fund size", value: formatDollars(FUND_SIZE) },
    { label: "Total deployed", value: formatDollars(deployed) },
    { label: "Remaining capital", value: formatDollars(remaining) },
    { label: "Investments", value: `${count} / 15` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {stat.label}
          </p>
          <p className="text-lg font-semibold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
