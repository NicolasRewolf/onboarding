import type { ReactNode } from "react";
import type { DayCell, MonthGrid } from "../event";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Ossature d'un mois (titre + en-tête jours + grille alignée lundi). Le contenu
 * d'une case-jour est délégué à `renderDay` : la page équipe y met des boutons
 * cliquables, le récap y met une carte de chaleur. Les cases hors fenêtre sont
 * rendues atténuées par la page appelante (via `cell.inRange`).
 */
export function MonthView({
  month,
  renderDay,
}: {
  month: MonthGrid;
  renderDay: (cell: DayCell) => ReactNode;
}) {
  return (
    <div className="border-2 border-rw-black bg-rw-white shadow-[var(--shadow-hard-sm)]">
      <div className="border-b-2 border-rw-black bg-rw-black px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-white">
          {month.label}
        </span>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-rw-line-subtle">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="border-b border-r border-rw-line-subtle bg-rw-paper-subtle py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-rw-tertiary"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: month.leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="border-b border-r border-rw-line-subtle bg-rw-paper-subtle/40" />
        ))}

        {month.days.map((cell) => (
          <div key={cell.date} className="border-b border-r border-rw-line-subtle">
            {renderDay(cell)}
          </div>
        ))}
      </div>
    </div>
  );
}
