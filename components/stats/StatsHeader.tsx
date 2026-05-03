import { formatNumber } from '@/shared/utils/format';

type Props = {
  totalIncomePerSec: number;
  count: number;
};

export function StatsHeader({ totalIncomePerSec, count }: Props) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-border/60 bg-card/30 p-8 md:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl"
      />

      <div className="relative grid gap-8 md:grid-cols-[1.8fr_1fr] md:items-end">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Total income · per second
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-6xl italic leading-[0.9] tracking-tight md:text-[7rem]">
              {formatNumber(totalIncomePerSec)}
            </span>
            <span className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">
              / s
            </span>
          </div>
        </div>

        <div className="md:text-right">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Brainrots in base
          </div>
          <div className="mt-3 font-serif text-5xl italic leading-none md:text-6xl">
            {count.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
}
