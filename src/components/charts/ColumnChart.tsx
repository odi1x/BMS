"use client";

import { useEffect, useRef, useState } from "react";

export type ColumnSeries = {
  key: string;
  values: number[];
  label: string;
  tone?: "ink" | "muted";
};

const PADDING_TOP = 16;
const PADDING_BOTTOM = 26;
const PADDING_START = 52;
const PADDING_END = 8;

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Columns with square corners, 4 faint gridlines, no y-axis line, and one
 * accent on the period the screen is about. A single series carries no
 * legend — the card title names it.
 *
 * The view box is measured, so one user unit is one CSS pixel: the axis
 * labels stay at 12px and the bars keep their proportions at any width.
 */
export function ColumnChart({
  labels,
  series,
  height = 190,
  highlightIndex,
  valueSuffix = "",
}: {
  labels: string[];
  series: ColumnSeries[];
  height?: number;
  highlightIndex?: number;
  valueSuffix?: string;
}) {
  const frame = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const plotWidth = Math.max(40, width - PADDING_START - PADDING_END);
  const rawMax = Math.max(...series.flatMap((item) => item.values), 0);
  const max = niceMax(rawMax * 1.06);
  const ticks = 4;
  const step = max / ticks;

  const slot = plotWidth / labels.length;
  const groupWidth = Math.min(30, slot * 0.5);
  const barWidth =
    series.length > 1 ? (groupWidth - 2 * (series.length - 1)) / series.length : groupWidth;

  return (
    <figure className="m-0" ref={frame}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="block"
        role="img"
        aria-label={series.map((item) => item.label).join(", ")}
      >
        {Array.from({ length: ticks + 1 }, (_, tick) => {
          const y = PADDING_TOP + plotHeight - (tick / ticks) * plotHeight;
          return (
            <g key={tick}>
              <line
                className="chart-grid-line"
                x1={PADDING_START}
                x2={width - PADDING_END}
                y1={y}
                y2={y}
              />
              <text className="chart-axis-text" x={PADDING_START - 8} y={y + 4} textAnchor="end">
                {Math.round(step * tick).toLocaleString("en-US")}
                {tick === ticks ? valueSuffix : ""}
              </text>
            </g>
          );
        })}

        {labels.map((label, index) => {
          const x = PADDING_START + slot * index + slot / 2;
          const groupStart = x - (series.length * barWidth + 2 * (series.length - 1)) / 2;
          const highlighted = highlightIndex === index;

          return (
            <g key={`${label}-${index}`}>
              {series.map((item, seriesIndex) => {
                const value = item.values[index] ?? 0;
                const barHeight = max === 0 ? 0 : (value / max) * plotHeight;
                const barX = groupStart + seriesIndex * (barWidth + 2);
                const y = PADDING_TOP + plotHeight - barHeight;
                const isMain = seriesIndex === 0;
                const accent = highlighted && isMain;

                return (
                  <rect
                    key={item.key}
                    className={accent ? "chart-current" : "chart-bar"}
                    x={barX}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, value > 0 ? 1.5 : 0)}
                    rx="2"
                    opacity={accent ? 1 : item.tone === "muted" ? 0.28 : 0.82}
                  />
                );
              })}
              <text className="chart-axis-text" x={x} y={height - 8} textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
