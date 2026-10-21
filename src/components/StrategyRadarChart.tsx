/**
 * Radar chart of strategy levels against the target.
 *
 * Loaded lazily (only when the results page opens) to keep the first page load small.
 * The chart is a visual summary only: the levels table next to it carries the same information
 * for screen reader users, and the datasets differ by line style as well as colour.
 */
import { useSyncExternalStore } from 'react';
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { E8Result } from '../lib/types.ts';
import { LEVEL_NAMES } from '../lib/text.ts';
import { chartDescription, wrapLabel } from './chartDescription.ts';

// Register only the parts of Chart.js a radar chart needs, so the rest is left out of the bundle.
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Re-renders when the system switches between light and dark mode. */
function useDarkMode(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia?.(DARK_QUERY);
      query?.addEventListener('change', onChange);
      return () => query?.removeEventListener('change', onChange);
    },
    () => window.matchMedia?.(DARK_QUERY).matches ?? false,
    () => false,
  );
}

/** Reads a colour token from the stylesheet, so the chart matches the current theme. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000000';
}

/** Light colours used when printing, so the chart reads well on white paper in any theme. */
const PRINT_COLOURS = {
  text: '#1b1f24',
  muted: '#4a5360',
  rule: '#d5dae0',
  primary: '#0b5394',
  focus: '#b4580b',
};

export default function StrategyRadarChart({
  e8,
  forPrint = false,
}: {
  e8: E8Result;
  /** True in the printed report: uses the light palette whatever the screen theme. */
  forPrint?: boolean;
}) {
  const dark = useDarkMode();
  const text = forPrint ? PRINT_COLOURS.text : token('--text');
  const muted = forPrint ? PRINT_COLOURS.muted : token('--muted');
  const rule = forPrint ? PRINT_COLOURS.rule : token('--rule');
  const primary = forPrint ? PRINT_COLOURS.primary : token('--primary');
  const focus = forPrint ? PRINT_COLOURS.focus : token('--focus');

  // Long names are wrapped onto two lines so they are not cut off on narrow screens.
  const labels = e8.strategies.map((s) => wrapLabel(s.strategy));

  return (
    <figure className="chart">
      <div className="chart__canvas">
        <Radar
          key={forPrint ? 'print' : dark ? 'dark' : 'light'}
          role="img"
          aria-label={chartDescription(e8)}
          data={{
            labels,
            datasets: [
              {
                label: 'Your level',
                // Incomplete strategies have no level, so they are left as a gap in the shape.
                data: e8.strategies.map((s) => s.level),
                borderColor: primary,
                backgroundColor: `${primary}33`,
                pointBackgroundColor: primary,
                pointRadius: 4,
                borderWidth: 2,
                fill: true,
                spanGaps: false,
              },
              {
                label: 'Your target',
                data: e8.strategies.map(() => e8.target),
                borderColor: focus,
                borderDash: [6, 4],
                pointRadius: 0,
                borderWidth: 2,
                fill: false,
              },
            ],
          }}
          options={{
            animation: false,
            maintainAspectRatio: false,
            scales: {
              r: {
                min: 0,
                max: 3,
                ticks: {
                  stepSize: 1,
                  color: muted,
                  backdropColor: 'transparent',
                  callback: (value) => `ML${value}`,
                },
                grid: { color: rule },
                angleLines: { color: rule },
                pointLabels: { color: text, font: { size: 11 } },
              },
            },
            plugins: {
              legend: { labels: { color: text } },
              tooltip: {
                callbacks: {
                  label: (item) =>
                    `${item.dataset.label}: ${
                      item.raw === null ? 'incomplete' : LEVEL_NAMES[item.raw as 0 | 1 | 2 | 3]
                    }`,
                },
              },
            },
          }}
        />
      </div>
      <figcaption className="muted">
        The table below shows the same results. Incomplete strategies are left as a gap.
      </figcaption>
    </figure>
  );
}
