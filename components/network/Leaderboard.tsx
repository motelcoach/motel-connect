"use client";

import { Badge } from "@/components/ui";
import { rankManagers } from "@/lib/ranking";
import { useStore } from "@/lib/store";
import type { AustralianState } from "@/lib/types";
import { AU_STATES } from "@/lib/types";
import { inputClass } from "@/components/ui";
import Image from "next/image";
import { useMemo, useState } from "react";

export function Leaderboard() {
  const { managers, contracts } = useStore();
  const [state, setState] = useState<AustralianState | "Nationwide">("Nationwide");
  const rows = useMemo(
    () => rankManagers(managers, contracts, state),
    [managers, contracts, state],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            Transparent ranking
          </p>
          <h1 className="font-serif text-3xl text-slate-900">Regional leaderboard</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Score from completed Premium shifts, rehire rate, owner ratings and
            regional experience. Non-vetted managers are excluded.
          </p>
        </div>
        <select
          className={inputClass + " max-w-xs"}
          value={state}
          onChange={(event) =>
            setState(event.target.value as AustralianState | "Nationwide")
          }
        >
          <option value="Nationwide">Nationwide</option>
          {AU_STATES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Shifts</th>
              <th className="px-4 py-3">Rehire</th>
              <th className="px-4 py-3">Owner avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.manager.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-serif text-lg">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={row.manager.photoUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {row.manager.profileType === "Couple" && row.manager.partnerName
                          ? `${row.manager.name.split(" ")[0]} & ${row.manager.partnerName}`
                          : row.manager.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.manager.location} · {row.manager.preferredLocations.join(", ")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {Math.round(row.score)}
                </td>
                <td className="px-4 py-3">{row.completedShifts}</td>
                <td className="px-4 py-3">
                  {row.reviewCount ? (
                    <Badge tone="teal">{Math.round(row.rehireRate * 100)}%</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.reviewCount ? row.avgOverall.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
