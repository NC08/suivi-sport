"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string; group?: string | null };

// Sélecteur qui écrit sa valeur dans l'URL (?param=…) : la page serveur
// recalcule les données correspondantes.
export function ParamSelect({
  param,
  options,
  value,
  label,
}: {
  param: string;
  options: Option[];
  value: string;
  label: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const groups = [...new Set(options.map((o) => o.group ?? ""))];

  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          params.set(param, e.target.value);
          router.replace(`?${params.toString()}`, { scroll: false });
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {groups.map((group) =>
          group ? (
            <optgroup key={group} label={group}>
              {options
                .filter((o) => (o.group ?? "") === group)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </optgroup>
          ) : (
            options
              .filter((o) => (o.group ?? "") === "")
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
          ),
        )}
      </select>
    </label>
  );
}
