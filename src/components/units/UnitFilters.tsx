"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function UnitFilters({
  labels,
  initial,
}: {
  labels: {
    search: string;
    placeholder: string;
    status: string;
    all: string;
    floor: string;
    statusPaid: string;
    statusPartial: string;
    statusUnpaid: string;
  };
  initial: { q: string; status: string; floor: string; floors: string[] };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initial.q);
  const [syncedQuery, setSyncedQuery] = useState(initial.q);

  if (initial.q !== syncedQuery) {
    setSyncedQuery(initial.q);
    setQuery(initial.q);
  }

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-[240px] flex-1 sm:max-w-[320px]"
        onSubmit={(event) => {
          event.preventDefault();
          update("q", query.trim());
        }}
      >
        <Search
          size={15}
          strokeWidth={1.7}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-ink-faint"
        />
        <label className="sr-only" htmlFor="unit-search">
          {labels.search}
        </label>
        <input
          id="unit-search"
          type="search"
          className="input ps-9"
          placeholder={labels.placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => update("q", query.trim())}
        />
      </form>

      <label className="sr-only" htmlFor="status-filter">
        {labels.status}
      </label>
      <select
        id="status-filter"
        className="select w-auto"
        value={initial.status}
        onChange={(event) => update("status", event.target.value)}
      >
        <option value="">{labels.status} · {labels.all}</option>
        <option value="PAID">{labels.statusPaid}</option>
        <option value="PARTIAL">{labels.statusPartial}</option>
        <option value="UNPAID">{labels.statusUnpaid}</option>
      </select>

      <label className="sr-only" htmlFor="floor-filter">
        {labels.floor}
      </label>
      <select
        id="floor-filter"
        className="select w-auto"
        value={initial.floor}
        onChange={(event) => update("floor", event.target.value)}
      >
        <option value="">{labels.floor} · {labels.all}</option>
        {initial.floors.map((floor) => (
          <option key={floor} value={floor}>
            {floor}
          </option>
        ))}
      </select>
    </div>
  );
}
