import type { BusyBlock } from "@/lib/google-calendar";

const DAY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "short",
});
const TIME_FORMAT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function BusyBlocksList({ blocks }: { blocks: BusyBlock[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-secondary">
        No tiene horarios ocupados registrados en los próximos 7 días.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {blocks.map((b, i) => {
        const start = new Date(b.start);
        const end = new Date(b.end);
        return (
          <li key={i} className="flex items-center justify-between">
            <span className="capitalize">{DAY_FORMAT.format(start)}</span>
            <span className="text-secondary">
              {TIME_FORMAT.format(start)}–{TIME_FORMAT.format(end)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
